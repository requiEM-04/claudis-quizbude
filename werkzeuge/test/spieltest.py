# Zwei-Spieler-Test mit nachgebautem Supabase (kein Server nötig).
# Start: im Repo-Ordner "python3 -m http.server 8765" laufen lassen, dann "python3 werkzeuge/test/spieltest.py".
import asyncio, json, re, os
HIER = os.path.dirname(os.path.abspath(__file__))
from playwright.async_api import async_playwright
BASIS = 'http://localhost:8765/'
L = json.loads(re.search(r'LAENDER = (\[.*\]);', open(os.path.join(HIER, '..', '..', 'js', 'laender.js')).read()).group(1))
NAME = {l['code']: l['name'] for l in L}
FAKE = open(os.path.join(HIER, 'supabase-fake.js')).read()
fehler = []

async def neu(ctx, url, tag):
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: fehler.append(f'{tag} PAGEERROR {e}'))
    pg.on('console', lambda m: m.type == 'error' and fehler.append(f'{tag} {m.text}'))
    await pg.goto(url)
    await pg.wait_for_timeout(400)
    return pg

async def registrieren(pg, name, avatar):
    await pg.click('[data-modus=neu]')
    await pg.fill('#anmelde-form [name=name]', name)
    await pg.fill('#anmelde-form [name=passwort]', 'test1234')
    await pg.click(f'#avatar-wahl [data-a="{avatar}"]')
    await pg.click('#anmelde-knopf')
    await pg.wait_for_selector('#s-bude:not([hidden])', timeout=5000)

async def code_jetzt(pg):
    return await pg.evaluate('quizbude.raum.frage.c')

async def warte_phase(pg, phase_id, timeout=20000):
    await pg.wait_for_selector(f'#{phase_id}:not([hidden])', timeout=timeout)

async def tippen(pg, text):
    await pg.fill('#rate-eingabe', text)
    await pg.press('#rate-eingabe', 'Enter')

async def spieler(pg):
    return await pg.eval_on_selector_all('#spieler-liste li', 'els => els.map(e => e.innerText.replace(/\\s+/g, " ").trim())')

async def waehle(pg, sel, wert):
    # eigene Klappliste: Knopf öffnen, dann den Eintrag mit dem passenden Index anklicken
    i = await pg.eval_on_selector(sel, '(e, w) => [...e.options].findIndex(o => o.value === w)', wert)
    assert i >= 0, (sel, wert)
    await pg.click(f'{sel} + .feld .feld-knopf')
    await pg.click(f'{sel} + .feld li[data-i="{i}"]')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        A = await neu(ctx, BASIS, 'A')
        await registrieren(A, 'Colin', '🦊')
        Bp = await neu(ctx, BASIS + '?sitzung=2', 'B')
        await registrieren(Bp, 'Leonie', '🐸')

        await A.click('.kachel[data-k=flaggen]')
        await warte_phase(A, 'p-warten')
        code = (await A.inner_text('#raum-code')).strip()
        print('Raum', code)
        await Bp.wait_for_timeout(800)
        liste = await Bp.inner_text('#raum-liste')
        print('Lobby bei B:', ' | '.join(liste.split('\n')[:3]))
        await Bp.screenshot(path='/tmp/t_lobby.png')
        await Bp.goto(BASIS + '?sitzung=2#/raum/' + code)   # Räume sind erst geschlossen: Beitritt per Code-Link
        await warte_phase(Bp, 'p-warten')
        await waehle(A, '#einst [data-e=runden]', '5')
        await waehle(A, '#einst [data-e=zeit]', '10')
        await Bp.wait_for_timeout(400)
        print('B sieht Runden:', await Bp.eval_on_selector('#einst [data-e=runden]', 'e => e.value + " disabled=" + e.disabled'))
        print('Spieler A:', await spieler(A))
        # Chat: eingeschränkt (Standard) blockt Grobes, Hass immer
        for t in ['Moin zusammen', 'du Hurensohn', 'n e g a']:
            await Bp.fill('#chat-eingabe', t); await Bp.press('#chat-eingabe', 'Enter'); await Bp.wait_for_timeout(250)
        await waehle(A, '#einst [data-e=chat]', 'offen'); await A.wait_for_timeout(300)
        for t in ['du Hurensohn', 'Neger']:
            await Bp.fill('#chat-eingabe', t); await Bp.press('#chat-eingabe', 'Enter'); await Bp.wait_for_timeout(250)
        print('Chat bei A:', await A.eval_on_selector_all('#chat-liste li:not(.system)', 'els => els.map(e => e.innerText)'))
        await waehle(A, '#einst [data-e=chat]', 'eingeschraenkt')
        await A.screenshot(path='/tmp/t_warten.png')

        # Spiel 1: tippen
        await A.click('#los')
        await warte_phase(A, 'p-countdown', 3000)
        await A.screenshot(path='/tmp/t_countdown.png')
        for i in range(5):
            await warte_phase(A, 'p-frage', 8000)
            await A.wait_for_function(f'document.getElementById("raum-runde").textContent.includes("Frage {i+1} ")', timeout=8000)
            await A.wait_for_timeout(300)
            c = await code_jetzt(A)
            cb = await code_jetzt(Bp)
            assert c == cb, (c, cb)
            if i == 0:
                await tippen(A, NAME[c]); await A.wait_for_timeout(500)
                await tippen(Bp, 'Atlantis'); await Bp.wait_for_timeout(300)
                print('B nach falsch:', await Bp.inner_text('#rueckmeldung'))
                await tippen(Bp, 'Neger'); await Bp.wait_for_timeout(300)
                print('Falschantworten rechts bei A:', await A.eval_on_selector_all('#chat-liste li.daneben', 'els => els.map(e => e.innerText.replace(/\\s+/g, " "))'))
                await A.screenshot(path='/tmp/t_frage.png')
                await tippen(Bp, NAME[c].lower())
            elif i == 1:
                print('Frage 2 läuft ab (keiner antwortet)')
            elif i == 2:
                await tippen(Bp, NAME[c]); await Bp.wait_for_timeout(200); await tippen(A, NAME[c])
            else:
                await tippen(A, NAME[c]); await tippen(Bp, NAME[c])
            await A.wait_for_function('document.getElementById("aufgeloest").textContent.length > 0', timeout=15000)
            if i == 0:
                await A.screenshot(path='/tmp/t_aufloesung.png')
                print('Auflösung:', await A.inner_text('#aufgeloest'), '/', await A.inner_text('#rueckmeldung'))
        await warte_phase(A, 'p-ende', 10000)
        await warte_phase(Bp, 'p-ende', 10000)
        await A.wait_for_timeout(1800)  # Punkte zählen hoch
        pa = await A.inner_text('#podest'); pb = await Bp.inner_text('#podest')
        print('Podest A:', pa.replace('\n', ' ')); print('Podest B:', pb.replace('\n', ' '))
        assert pa == pb
        await A.screenshot(path='/tmp/t_ende.png')
        profile = await A.evaluate('JSON.parse(localStorage.getItem("fake.profile"))')
        print('Profile:', [(x['name'], x['spiele'], x['siege'], x['punkte'], x['richtig']) for x in profile])
        print('Log:', await A.evaluate('JSON.parse(localStorage.getItem("fake.spiele")).length'))

        # Spiel 2: Auswahl-Modus + Gastgeber geht nach Frage 1
        print('B am Ende:', await Bp.inner_text('#ende-text'), '| Knöpfe bei B sichtbar:', await Bp.is_visible('#nochmal'), await Bp.is_visible('#andere-kategorie'))
        await A.click('#andere-kategorie')
        await warte_phase(A, 'p-warten'); await warte_phase(Bp, 'p-warten')
        print('Andere Kategorie -> beide im Warteraum, Raum:', await A.inner_text('#raum-code'), '/', await Bp.inner_text('#raum-code'), '| Spieler:', len(await spieler(A)))
        await waehle(A, '#einst [data-e=modus]', 'auswahl')
        await A.wait_for_timeout(300)
        await A.click('#los')
        await warte_phase(Bp, 'p-frage', 8000)
        await Bp.wait_for_timeout(300)
        c = await code_jetzt(Bp)
        await Bp.click(f'#optionen button[data-c="{c}"]')
        await A.click('#optionen button:not([data-c="' + c + '"])')
        await Bp.wait_for_timeout(300)
        print('Falsch geklickt rechts bei B:', await Bp.eval_on_selector_all('#chat-liste li.daneben', 'els => els.map(e => e.innerText.replace(/\\s+/g, " ")).slice(-1)'))
        await Bp.screenshot(path='/tmp/t_auswahl.png')
        print('Status B-Liste:', await spieler(Bp))
        await A.wait_for_function('document.getElementById("aufgeloest").textContent.length > 0', timeout=15000)
        await A.goto(BASIS + '#/')   # Gastgeber geht
        await A.wait_for_timeout(1500)
        print('B nach Gastgeber-Wechsel:', await spieler(Bp))
        for i in range(1, 5):
            await Bp.wait_for_function(f'document.getElementById("raum-runde").textContent.includes("Frage {i+1} ")', timeout=12000)
            await Bp.wait_for_timeout(200)
            c = await code_jetzt(Bp)
            await Bp.click(f'#optionen button[data-c="{c}"]')
        await warte_phase(Bp, 'p-ende', 15000)
        await Bp.wait_for_timeout(1500)
        print('Endstand B allein:', (await Bp.inner_text('#podest')).replace('\n', ' '))
        print('Nochmal-Knopf bei B sichtbar:', await Bp.is_visible('#nochmal'))
        await A.wait_for_timeout(500)
        await A.screenshot(path='/tmp/t_bude_nach.png')
        print('Bestenliste A:', (await A.inner_text('#besten-liste')).replace('\n', ' '))
        print('Letzte A:', (await A.inner_text('#letzte-liste')).replace('\n', ' | '))
        print('FEHLER:', fehler)
        await b.close()
asyncio.run(main())
