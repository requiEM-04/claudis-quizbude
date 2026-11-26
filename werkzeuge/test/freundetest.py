# Freunde mit nachgebautem Supabase: Anfrage, Annehmen, online sehen, in den Raum einladen, beitreten, entfernen.
# Start: "python3 -m http.server 8765" im Repo-Ordner, dann "python3 werkzeuge/test/freundetest.py [bilderordner]".
import asyncio, os, sys
HIER = os.path.dirname(os.path.abspath(__file__))
from playwright.async_api import async_playwright
BASIS = 'http://localhost:8765/'
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
FAKE = open(os.path.join(HIER, 'supabase-fake.js')).read()
fehler = []

async def neu(ctx, url, tag):
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: fehler.append(f'{tag} PAGEERROR {e}'))
    pg.on('console', lambda m: m.type == 'error' and fehler.append(f'{tag} {m.text}'))
    await pg.goto(url); await pg.wait_for_timeout(400)
    return pg

async def registrieren(pg, name):
    await pg.click('[data-modus=neu]')
    await pg.fill('#anmelde-form [name=name]', name)
    await pg.fill('#anmelde-form [name=passwort]', 'test1234')
    await pg.click('#avatar-wahl button:nth-child(2)')
    await pg.click('#anmelde-knopf')
    await pg.wait_for_selector('#s-bude:not([hidden])', timeout=5000)

ZU = "setInterval(() => { const d = document.getElementById('aufstieg'); if (d && d.open) d.close(); }, 50)"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script(ZU)
        A = await neu(ctx, BASIS, 'A'); await registrieren(A, 'Colin')
        B = await neu(ctx, BASIS + '?sitzung=2', 'B'); await registrieren(B, 'Leonie')
        await A.wait_for_timeout(600)
        print('Dock-Knopf sichtbar:', await A.is_visible('#dock-freunde'))
        # Anfrage von Colin an Leonie
        await A.click('#dock-freunde'); await A.wait_for_selector('#freunde-fenster[open]')
        await A.fill('#fr-form [name=wer]', 'leonie'); await A.click('#fr-form button[type=submit]'); await A.wait_for_timeout(900)
        print('Toast A:', await A.text_content('#toast'))
        await B.wait_for_timeout(1200)
        print('Toast B:', await B.text_content('#toast'), '| Zähler B:', await B.text_content('#freunde-zahl'), await B.get_attribute('#freunde-zahl', 'class'))
        await A.screenshot(path=f'{BILDER}/fr_gesendet.png')
        # Leonie nimmt an
        await B.click('#dock-freunde'); await B.wait_for_selector('#freunde-fenster [data-fr=ja]')
        await B.screenshot(path=f'{BILDER}/fr_anfrage.png')
        await B.click('#freunde-fenster [data-fr=ja]'); await B.wait_for_timeout(700)
        print('B Liste:', await B.eval_on_selector_all('#fr-innen .fr-liste li', 'l => l.map(e => e.innerText.replace(/\\s+/g, " "))'))
        await B.click('#freunde-fenster [data-fr=zu]')
        await A.wait_for_timeout(800)
        print('A Liste:', await A.eval_on_selector_all('#fr-innen .fr-liste li', 'l => l.map(e => e.innerText.replace(/\\s+/g, " "))'), '| Zähler A:', await A.text_content('#freunde-zahl'))
        await A.click('#freunde-fenster [data-fr=zu]')
        # Colin macht einen Raum auf und lädt Leonie ein
        await A.click('.kachel[data-k=flaggen]'); await A.wait_for_selector('#p-warten:not([hidden])')
        code = (await A.inner_text('#raum-code')).strip()
        await A.click('#raum-freunde'); await A.wait_for_selector('#freunde-fenster [data-fr=einladen]', timeout=5000)
        await A.screenshot(path=f'{BILDER}/fr_einladen.png')
        await A.click('#freunde-fenster [data-fr=einladen]'); await A.wait_for_timeout(500)
        print('Knopf nach Einladen:', await A.text_content('#freunde-fenster [data-fr=einladen]'))
        await B.wait_for_selector('#einladung:not([hidden])', timeout=5000); await B.wait_for_timeout(500)
        print('Einladung bei B:', (await B.inner_text('#einladung')).replace('\n', ' '))
        await B.screenshot(path=f'{BILDER}/fr_einladung.png')
        await B.click('#einladung [data-ei=ja]'); await B.wait_for_selector('#p-warten:not([hidden])', timeout=6000)
        print('B im Raum:', (await B.inner_text('#raum-code')).strip() == code, code)
        await A.wait_for_timeout(800)
        print('A sieht Leonie hier:', await A.eval_on_selector_all('#fr-innen .fr-liste li', 'l => l.map(e => e.innerText.replace(/\\s+/g, " "))'))
        await A.click('#freunde-fenster [data-fr=zu]')
        # Mitspielen-Knopf: Leonie geht raus in die Bude, Colin bleibt im Raum
        await B.evaluate("location.hash = '#/'"); await B.wait_for_selector('#s-bude:not([hidden])')
        await B.click('#dock-freunde'); await B.wait_for_timeout(600)
        print('B sieht Colin:', await B.eval_on_selector_all('#fr-innen .fr-liste li', 'l => l.map(e => e.innerText.replace(/\\s+/g, " "))'))
        # Entfernen mit Rückfrage
        await B.click('#freunde-fenster [data-fr=weg]'); print('Rückfrage:', await B.text_content('#freunde-fenster [data-fr=weg]'))
        await B.click('#freunde-fenster [data-fr=weg]'); await B.wait_for_timeout(600)
        print('B nach Entfernen:', await B.inner_text('#fr-innen .fr-leer'))
        print('FEHLER:', fehler)
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
