import asyncio, json, re, os
from playwright.async_api import async_playwright
FAKE = open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'supabase-fake.js')).read()
B = 'http://localhost:8765/'
L = json.loads(re.search(r'LAENDER = (\[.*\]);', open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'js', 'laender.js')).read()).group(1))
NAME = {l['code']: l['name'] for l in L}
async def gast(ctx, s, fehler, tag):
    pg = await ctx.new_page(); pg.on('pageerror', lambda e: fehler.append(tag + ' ' + str(e))); pg.on('console', lambda m: m.type == 'error' and fehler.append(tag + ' ' + m.text))
    await pg.goto(B + f'?sitzung={s}'); await pg.wait_for_timeout(400)
    await pg.click('#gast-los'); await pg.wait_for_selector('#s-bude:not([hidden])', timeout=5000)
    return pg
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); fehler = []
        ctxA = await b.new_context(viewport={'width': 1600, 'height': 900}); ctxB = await b.new_context(viewport={'width': 1280, 'height': 720})
        for c in (ctxA, ctxB): await c.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        # Fake-Server teilt sich BroadcastChannel nur im selben Kontext: deshalb gleicher Kontext für beide Gäste
        A = await gast(ctxA, 11, fehler, 'A')
        Bp = await ctxA.new_page(); Bp.on('pageerror', lambda e: fehler.append('B ' + str(e)))
        await Bp.goto(B + '?sitzung=12'); await Bp.wait_for_timeout(400)
        print('Zweiter Tab gleich Gast (localStorage geteilt):', await Bp.evaluate("localStorage.getItem('quizbude.gast')"), '| Name A/B:', await A.inner_text('#profil-chip'), '/', await Bp.inner_text('#profil-chip'))
        await A.click('#kachel-raster .kachel[data-k=flaggen]'); await A.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(400)
        code = await A.inner_text('#raum-code'); await Bp.goto(B + '?sitzung=12#/raum/' + code); await Bp.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(700)
        print('Spieler:', (await A.inner_text('#spieler-liste')).replace('\n', ' '))
        await A.evaluate('quizbude.raum.einst.runden = 3')
        await A.click('#los')
        # A tippt immer richtig, B einmal richtig, sonst falsch
        for runde in range(3):
            await A.wait_for_function('quizbude.raum.phase === "frage"', timeout=15000); await A.wait_for_timeout(300)
            n = NAME[await A.evaluate('quizbude.raum.frage.c')]
            await A.fill('#rate-eingabe', n); await A.press('#rate-eingabe', 'Enter')
            await Bp.fill('#rate-eingabe', n if runde == 1 else 'Atlantis'); await Bp.press('#rate-eingabe', 'Enter')
            await A.wait_for_function('quizbude.raum.phase !== "frage"', timeout=30000)
        await A.wait_for_function('quizbude.raum.phase === "ende"', timeout=90000); await A.wait_for_timeout(2200)
        print('Ende:', await A.inner_text('#ende-titel'), '|', (await A.inner_text('#podest')).replace('\n', ' '))
        print('Gäste nicht gespeichert:', await A.evaluate('(JSON.parse(localStorage.getItem("fake.spiele")) || []).length'), 'Logeinträge')
        await A.screenshot(path='/tmp/qbtest/g_ende.png')
        print('Fehler:', fehler); await b.close()
asyncio.run(main())
