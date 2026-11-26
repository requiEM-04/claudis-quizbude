# Varianten (Schwierigkeit, Richtung, Aufdecken), Gemischt-Auswahl und Schätzfragen im Raum und im Sprint, mit nachgebautem Supabase.
# Start: im Repo-Ordner "python3 -m http.server 8765", dann "python3 werkzeuge/test/variantentest.py [ordner-fuer-bilder]".
import asyncio, os, sys
from playwright.async_api import async_playwright
HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
from kategorientest import neu, registrieren, waehle, ANTWORTEN, BASIS, FAKE, fehler
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'

async def runde(A, B, name, bild=True):
    await A.click('#los')
    erste = True
    while True:
        await A.wait_for_function('["frage","ende"].includes(quizbude.raum.phase)', timeout=20000)
        if await A.evaluate('quizbude.raum.phase') == 'ende': break
        idx = await A.evaluate('quizbude.raum.idx')
        await A.wait_for_timeout(1400 if erste else 300)
        if erste and bild: await A.screenshot(path=f'{BILDER}/v_{name}.png')
        await B.evaluate(ANTWORTEN, idx % 2 == 1)
        await A.evaluate(ANTWORTEN, False)
        await A.wait_for_function(f'quizbude.raum.phase !== "frage" || quizbude.raum.idx !== {idx}', timeout=30000)
        if erste and bild: await A.wait_for_timeout(500); await A.screenshot(path=f'{BILDER}/v_{name}_aufl.png')
        erste = False
    print(name, 'Ende:', (await A.inner_text('#podest')).replace('\n', ' ')[:80])
    await A.click('#andere-kategorie'); await A.wait_for_selector('#p-warten:not([hidden])')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script("setInterval(() => { const d = document.getElementById('aufstieg'); if (d && d.open) d.close(); }, 150)")
        A = await neu(ctx, BASIS, 'A'); await registrieren(A, 'Colin', '🦊')
        B = await neu(ctx, BASIS + '?sitzung=2', 'B'); await registrieren(B, 'Leonie', '🐸')
        await A.click('.kachel[data-k=gemischt]'); await A.wait_for_selector('#p-warten:not([hidden])')
        code = (await A.inner_text('#raum-code')).strip()
        await B.goto(BASIS + '?sitzung=2#/raum/' + code); await B.wait_for_selector('#p-warten:not([hidden])')
        # Gemischt: Wissen, Größer und Flaggen abwählen
        for art in ['wissen', 'groesser', 'flaggen', 'umrisse', 'stadtland']:
            await A.click(f'#einst-arten [data-art={art}]'); await A.wait_for_timeout(200)
        await waehle(A, '#einst [data-e=runden]', '10'); await waehle(A, '#einst [data-e=zeit]', '10'); await A.wait_for_timeout(300)
        await A.screenshot(path=f'{BILDER}/v_warten_gemischt.png')
        print('Gemischt an (A):', await A.eval_on_selector_all('#einst-arten .art-chip.an', 'l => l.map(e => e.dataset.art)'))
        print('Gemischt an (B):', await B.eval_on_selector_all('#einst-arten .art-chip.an', 'l => l.map(e => e.dataset.art)'), '| B kann klicken:', not await B.eval_on_selector('#einst-arten .art-chip', 'e => e.disabled'))
        await A.click('#los')
        arten = set()
        while True:
            await A.wait_for_function('["frage","ende"].includes(quizbude.raum.phase)', timeout=20000)
            if await A.evaluate('quizbude.raum.phase') == 'ende': break
            idx = await A.evaluate('quizbude.raum.idx'); arten.add(await A.evaluate('quizbude.raum.frage.k'))
            await A.wait_for_timeout(300)
            await B.evaluate(ANTWORTEN, False); await A.evaluate(ANTWORTEN, idx % 2 == 0)
            await A.wait_for_function(f'quizbude.raum.phase !== "frage" || quizbude.raum.idx !== {idx}', timeout=30000)
        print('Gemischt Arten gespielt:', sorted(arten))
        await A.click('#andere-kategorie'); await A.wait_for_selector('#p-warten:not([hidden])')
        # Varianten je Kategorie
        for kat, var, name in [('buchstaben', 'leicht', 'salat_leicht'), ('buchstaben', 'schwer', 'salat_schwer'), ('nachbarn', 'schwer', 'nachbarn_schwer'),
                               ('flaggen', 'aufdecken', 'flaggen_auf'), ('schaetzen', None, 'schaetzen')]:
            await waehle(A, '#einst-kategorie', kat); await A.wait_for_timeout(300)
            if var: await waehle(A, '#einst-variante', var); await A.wait_for_timeout(300)
            await waehle(A, '#einst [data-e=runden]', '5'); await waehle(A, '#einst [data-e=zeit]', '15' if kat == 'flaggen' else '10'); await A.wait_for_timeout(300)
            sicht = await B.evaluate("({v: document.getElementById('einst-variante').value, titel: document.getElementById('einst-variante-titel').textContent, versteckt: document.querySelector('.einst-variante').hidden, modus: document.querySelector('.einst-modus').hidden})")
            print(name, 'B sieht:', sicht)
            if name == 'salat_leicht': await A.screenshot(path=f'{BILDER}/v_warten_{name}.png')
            await runde(A, B, name)
        # Sprint: mehr Einstellungen
        await A.goto(BASIS + '#/sprint'); await A.wait_for_selector('#s-sprintwahl:not([hidden])'); await A.wait_for_timeout(400)
        await A.click('.sl-zeile[data-k=buchstaben]'); await A.click('.sv-opt [data-v=schwer]'); await A.wait_for_timeout(200)
        await A.screenshot(path=f'{BILDER}/v_sprint_mehr.png', full_page=True)
        print('Sprint-Übung markiert:', await A.eval_on_selector_all('.sl-marke.uebung', 'l => l.map(e => e.closest(".sl-zeile").dataset.k)'), '|', await A.inner_text('.sv-wahl small'))
        for kat in ['schaetzen', 'buchstaben']:
            await A.click(f'.sl-zeile[data-k={kat}]'); await A.click('.sv-start')
            await A.wait_for_function('quizbude.sprint && quizbude.sprint.laeuft', timeout=8000); await A.wait_for_timeout(600)
            print(kat, 'Sprint-Hinweis:', await A.inner_text('#sprint-hinweis'), '| Übung:', await A.evaluate('quizbude.sprint.uebung'))
            if kat == 'schaetzen':
                await A.fill('#sprint-eingabe', '1,5 Mio'); await A.screenshot(path=f'{BILDER}/v_sprint_schaetzen.png')
                await A.evaluate("document.getElementById('sprint-form').requestSubmit()"); await A.wait_for_timeout(400)
                print('  Rückmeldung:', await A.inner_text('#sprint-rueck'))
                await A.wait_for_timeout(2400)
                rich = await A.evaluate("(async () => { const v = document.getElementById('version').textContent; const S = (await import('./js/schaetzen.js?v=' + v)).SCHAETZEN; return String(S[quizbude.sprint.frage.n].a).replace('.', ','); })()")
                await A.fill('#sprint-eingabe', rich); await A.evaluate("document.getElementById('sprint-form').requestSubmit()"); await A.wait_for_timeout(300)
                print('  richtig geschätzt:', await A.inner_text('#sprint-rueck'), '| Punkte', await A.evaluate('quizbude.sprint.punkte'))
            else:
                await A.screenshot(path=f'{BILDER}/v_sprint_{kat}.png')
            await A.evaluate('quizbude.sprint.ende = performance.now() + 100')
            await A.wait_for_selector('#sp-ende:not([hidden])', timeout=5000); await A.wait_for_timeout(500)
            print('  Ende:', await A.inner_text('#sprint-kat'), '|', await A.inner_text('#sprint-rekord'))
            await A.screenshot(path=f'{BILDER}/v_sprint_{kat}_ende.png')
            await A.evaluate("location.hash = '#/sprint'"); await A.wait_for_selector('#s-sprintwahl:not([hidden])'); await A.wait_for_timeout(300)
        print('FEHLER:', fehler)
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
