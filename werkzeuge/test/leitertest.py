# Spielleiter: Gastgeber leitet nur (keine Eingabe, keine Wertung), Start erst ab 2 Mitspielern. Mit nachgebautem Supabase.
# Start: im Repo-Ordner "python3 -m http.server 8765", dann "python3 werkzeuge/test/leitertest.py [ordner-fuer-bilder]".
import asyncio, os, sys
from playwright.async_api import async_playwright
HIER = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HIER)
from kategorientest import neu, registrieren, waehle, ANTWORTEN, BASIS, FAKE, fehler
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script("setInterval(() => { const d = document.getElementById('aufstieg'); if (d && d.open) d.close(); }, 150)")
        A = await neu(ctx, BASIS, 'A'); await registrieren(A, 'Colin', '🦊')
        B = await neu(ctx, BASIS + '?sitzung=2', 'B'); await registrieren(B, 'Leonie', '🐸')
        C = await neu(ctx, BASIS + '?sitzung=3', 'C'); await registrieren(C, 'Tim', '🐼')
        await A.click('.kachel[data-k=flaggen]'); await A.wait_for_selector('#p-warten:not([hidden])')
        code = (await A.inner_text('#raum-code')).strip()
        await waehle(A, '#einst-leiter', 'leiten'); await waehle(A, '#einst [data-e=runden]', '5'); await waehle(A, '#einst [data-e=zeit]', '15')
        await B.goto(BASIS + '?sitzung=2#/raum/' + code); await B.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(900)
        print('Mit 1 Mitspieler: Start aus:', await A.eval_on_selector('#los', 'e => e.disabled'), '|', await A.inner_text('#los-hinweis'))
        print('B sieht Gastgeber-Einstellung:', await B.eval_on_selector('#einst-leiter', 'e => e.value'))
        await C.goto(BASIS + '?sitzung=3#/raum/' + code); await C.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(900)
        print('Mit 2 Mitspielern: Start aus:', await A.eval_on_selector('#los', 'e => e.disabled'))
        await A.screenshot(path=f'{BILDER}/l_warten.png')
        await A.click('#los')
        for runde in range(5):
            await A.wait_for_function('["frage","ende"].includes(quizbude.raum.phase)', timeout=20000)
            if await A.evaluate('quizbude.raum.phase') == 'ende': break
            idx = await A.evaluate('quizbude.raum.idx'); await A.wait_for_timeout(500)
            if runde == 0:
                print('A: Eingabe versteckt:', await A.eval_on_selector('#rate-form', 'e => e.hidden'), '| Hinweis:', await A.inner_text('#leiter-stand'))
                print('A tippt trotzdem (per Code):', await A.evaluate("quizbude.raum.raten('Test')"))
                await A.click('#leiter-loesung-knopf'); await A.wait_for_timeout(200)
                print('A Lösung:', await A.inner_text('#leiter-loesung'))
            await B.evaluate(ANTWORTEN, False); await A.wait_for_timeout(300)
            if runde == 0: print('A nach B:', await A.inner_text('#leiter-stand')); await A.screenshot(path=f'{BILDER}/l_frage.png')
            t0 = await A.evaluate('performance.now()')
            await C.evaluate(ANTWORTEN, runde % 2 == 1)
            await A.wait_for_function(f'quizbude.raum.phase !== "frage" || quizbude.raum.idx !== {idx}', timeout=30000)
            if runde == 0: print('Auflösung ohne auf A zu warten nach', round((await A.evaluate('performance.now()') - t0) / 1000, 1), 's')
        await A.wait_for_function('quizbude.raum.phase === "ende"', timeout=40000); await A.wait_for_timeout(1800)
        print('Endstand bei B:', (await B.inner_text('#podest')).replace('\n', ' '))
        print('Colin im Endstand:', 'Colin' in await B.inner_text('#podest'), '| Ende-Text A:', await A.inner_text('#ende-text'))
        print('Spielerliste A:', (await A.inner_text('#spieler-liste')).replace('\n', ' '))
        await A.screenshot(path=f'{BILDER}/l_ende.png')
        # zurück auf Mitspielen, dann reicht wieder 2
        await A.click('#andere-kategorie'); await A.wait_for_selector('#p-warten:not([hidden])')
        await C.goto(BASIS + '?sitzung=3#/'); await A.wait_for_timeout(1500)
        print('Leitet, nur 1 Mitspieler: Start aus:', await A.eval_on_selector('#los', 'e => e.disabled'))
        await waehle(A, '#einst-leiter', 'mit'); await A.wait_for_timeout(500)
        print('Spielt mit, 2 Leute: Start aus:', await A.eval_on_selector('#los', 'e => e.disabled'))
        print('FEHLER:', fehler)
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
