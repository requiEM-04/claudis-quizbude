# Bombe und Mehr oder weniger: Raum mit zwei Leuten (doppeltes Wort, Gründe, Knall) und Sprint, mit nachgebautem Supabase.
# Start: im Repo-Ordner "python3 -m http.server 8765", dann "python3 werkzeuge/test/bombetest.py [ordner-fuer-bilder]".
import asyncio, os, sys
from playwright.async_api import async_playwright
HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
from kategorientest import neu, registrieren, waehle, ANTWORTEN, BASIS, FAKE, fehler
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
WORT = """async () => { const v = document.getElementById('version').textContent; const m = await import('./js/kategorien.js?v=' + v);
  const B = (await import('./js/bombe-woerter.js?v=' + v)).BEISPIELE.split(' '); const f = (quizbude.raum || quizbude.sprint).frage;
  return B.find(w => w.includes(f.s.toLowerCase()) && w !== f.s.toLowerCase() && !m.bombeBenutzt.has(w)); }"""
async def tippe(pg, form, feld, text):
    await pg.fill(feld, text); await pg.evaluate(f"document.getElementById('{form}').requestSubmit()"); await pg.wait_for_timeout(250)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script("setInterval(() => { const d = document.getElementById('aufstieg'); if (d && d.open) d.close(); }, 150)")
        A = await neu(ctx, BASIS, 'A'); await registrieren(A, 'Colin', '🦊')
        B = await neu(ctx, BASIS + '?sitzung=2', 'B'); await registrieren(B, 'Leonie', '🐸')
        await A.screenshot(path=f'{BILDER}/b_bude.png')
        await A.click('.kachel[data-k=bombe]'); await A.wait_for_selector('#p-warten:not([hidden])')
        code = (await A.inner_text('#raum-code')).strip()
        await B.goto(BASIS + '?sitzung=2#/raum/' + code); await B.wait_for_selector('#p-warten:not([hidden])')
        await waehle(A, '#einst [data-e=runden]', '5'); await waehle(A, '#einst [data-e=zeit]', '10'); await A.wait_for_timeout(300)
        print('Modus versteckt:', await A.evaluate("document.querySelector('.einst-modus').hidden"), '| Auswahl:', await A.eval_on_selector('#einst-auswahl', 'e => e.value'))
        await A.click('#los')
        for runde in range(5):
            await A.wait_for_function('["frage","ende"].includes(quizbude.raum.phase)', timeout=20000)
            if await A.evaluate('quizbude.raum.phase') == 'ende': break
            idx = await A.evaluate('quizbude.raum.idx'); silbe = await A.evaluate('quizbude.raum.frage.s')
            await A.wait_for_timeout(900)
            if runde == 0: await A.screenshot(path=f'{BILDER}/b_raum_frage.png')
            w = await A.evaluate(WORT)
            await tippe(A, 'rate-form', '#rate-eingabe', w); ra = await A.inner_text('#rueckmeldung')
            if runde < 3:
                await B.wait_for_timeout(500)
                await tippe(B, 'rate-form', '#rate-eingabe', w); rb1 = await B.inner_text('#rueckmeldung')
                await tippe(B, 'rate-form', '#rate-eingabe', 'Haus'); rb2 = await B.inner_text('#rueckmeldung')
                await tippe(B, 'rate-form', '#rate-eingabe', 'qwe' + silbe.lower() + 'xyz'); rb3 = await B.inner_text('#rueckmeldung')
                print(f'Runde {runde + 1} {silbe}: A "{w}" -> {ra} | B gleiches Wort -> {rb1} | Haus -> {rb2} | Quatsch -> {rb3}')
            if runde == 1:
                w2 = await B.evaluate(WORT); await tippe(B, 'rate-form', '#rate-eingabe', w2); print('  B eigenes Wort', w2, '->', await B.inner_text('#rueckmeldung'))
            await A.wait_for_function(f'quizbude.raum.phase !== "frage" || quizbude.raum.idx !== {idx}', timeout=30000)
            await A.wait_for_timeout(500)
            if runde in (0, 1): await A.screenshot(path=f'{BILDER}/b_raum_aufl_{runde}.png')
            if runde == 0: print('  Auflösung:', await A.inner_text('#aufgeloest'), '|', await A.inner_text('#rueckmeldung'))
        await A.wait_for_function('quizbude.raum.phase === "ende"', timeout=30000); await A.wait_for_timeout(1500)
        print('Chat:', (await A.inner_text('#chat-liste')).replace('\n', ' / ')[-300:] if await A.query_selector('#chat-liste') else '')
        await A.click('#andere-kategorie'); await A.wait_for_selector('#p-warten:not([hidden])')
        # Mehr oder weniger im Raum
        await waehle(A, '#einst-kategorie', 'mehr'); await A.wait_for_timeout(300)
        await waehle(A, '#einst [data-e=runden]', '5'); await A.wait_for_timeout(200)
        await A.click('#los')
        for runde in range(5):
            await A.wait_for_function('["frage","ende"].includes(quizbude.raum.phase)', timeout=20000)
            if await A.evaluate('quizbude.raum.phase') == 'ende': break
            idx = await A.evaluate('quizbude.raum.idx'); await A.wait_for_timeout(600)
            if runde == 0: await A.screenshot(path=f'{BILDER}/b_mehr_frage.png')
            await A.evaluate(ANTWORTEN, runde % 2 == 1); await A.wait_for_timeout(300)
            if runde == 0: await A.screenshot(path=f'{BILDER}/b_mehr_gewaehlt.png'); print('Mehr gewählt:', await A.inner_text('#rueckmeldung'))
            await B.evaluate(ANTWORTEN, False)
            await A.wait_for_function(f'quizbude.raum.phase !== "frage" || quizbude.raum.idx !== {idx}', timeout=30000)
        print('Mehr Ende:', (await A.inner_text('#podest')).replace('\n', ' ')[:60])
        # Sprints
        for kat in ['bombe', 'mehr']:
            await A.goto(BASIS + '#/sprint'); await A.wait_for_selector('#s-sprintwahl:not([hidden])'); await A.wait_for_timeout(400)
            if kat == 'bombe': await A.screenshot(path=f'{BILDER}/b_sprintwahl.png')
            await A.click(f'.sl-zeile[data-k={kat}]'); await A.click('.sv-start')
            await A.wait_for_function('quizbude.sprint && quizbude.sprint.laeuft', timeout=10000); await A.wait_for_timeout(700)
            await A.screenshot(path=f'{BILDER}/b_sprint_{kat}.png')
            for i in range(6):
                await A.wait_for_timeout(300)
                if kat == 'bombe':
                    w = await A.evaluate(WORT); await tippe(A, 'sprint-form', '#sprint-eingabe', w)
                else:
                    await A.evaluate(ANTWORTEN.replace('quizbude.raum', 'quizbude.sprint').replace("r.phase !== 'frage' || r.meinStatus", '!r.laeuft').replace('#optionen', '#sprint-optionen'), False); await A.wait_for_timeout(1300)
            print(kat, 'Sprint Treffer:', await A.evaluate('quizbude.sprint.punkte'))
            await A.evaluate('quizbude.sprint.ende = performance.now() + 100')
            await A.wait_for_selector('#sp-ende:not([hidden])', timeout=5000); await A.wait_for_timeout(600)
            await A.screenshot(path=f'{BILDER}/b_sprint_{kat}_ende.png', full_page=True)
            print(kat, 'Ende:', await A.inner_text('#sprint-rekord'), '|', (await A.inner_text('#sprint-richtig')).replace('\n', ', ')[:160])
        print('FEHLER:', fehler)
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
