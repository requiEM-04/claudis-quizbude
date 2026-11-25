import asyncio
from playwright.async_api import async_playwright
FAKE = open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'supabase-fake.js')).read()
B = 'http://localhost:8765/'
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
        await A.click('#kachel-raster .kachel[data-k=spiele]'); await A.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(400)
        code = await A.inner_text('#raum-code'); await Bp.goto(B + '?sitzung=12#/raum/' + code); await Bp.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(700)
        print('Spieler:', (await A.inner_text('#spieler-liste')).replace('\n', ' '), '| Spiel:', await A.inner_text('#einst-auswahl + .feld .feld-text'))
        await A.click('#los'); await A.wait_for_timeout(300)
        # Flackern: wie oft ändert sich der Countdown in 1,5 s?
        await A.evaluate('''() => { window.__wechsel = 0; new MutationObserver(m => window.__wechsel += m.length).observe(document.getElementById('spiel-countdown'), { childList: true, subtree: true, characterData: true }); }''')
        await A.wait_for_timeout(1500)
        print('Countdown-Änderungen in 1,5 s:', await A.evaluate('window.__wechsel'), '|', (await A.inner_text('#spiel-countdown')).replace('\n', ' '))
        await A.screenshot(path='/tmp/qbtest/s_countdown.png')
        await A.wait_for_function('quizbude.raum.phase === "spiel" && quizbude.raum.kurve', timeout=8000)
        await A.evaluate('quizbude.raum.kurve.ziel = 1')
        await A.wait_for_timeout(1600)
        print('Feldbreite A:', await A.evaluate("document.getElementById('spiel-feld').clientWidth"), 'px | Seitenleiste weg:', await A.evaluate("getComputedStyle(document.querySelector('.raum-raster > .seite')).display"))
        # Rakete: A bekommt Munition und feuert auf B
        await A.evaluate('''() => { const k = quizbude.raum.kurve; const a = k.s[0], b = k.s[1]; a.munition = 3; a.a = Math.atan2(b.y - a.y, b.x - a.x); }''')
        await A.keyboard.press('ArrowUp'); await A.wait_for_timeout(120)
        await A.screenshot(path='/tmp/qbtest/s_rakete.png')
        await A.wait_for_timeout(1500)
        print('Nach Schuss: B lebt?', await A.evaluate('quizbude.raum.kurve.s[1].lebt'), '| Munition A:', await A.evaluate('quizbude.raum.kurve.s[0].munition'))
        await Bp.screenshot(path='/tmp/qbtest/s_rakete_b.png')
        await A.wait_for_function('quizbude.raum.phase === "ende"', timeout=30000); await A.wait_for_timeout(1500)
        print('Ende:', await A.inner_text('#ende-titel'), '|', (await A.inner_text('#podest')).replace('\n', ' '))
        print('Fehler:', fehler); await b.close()
asyncio.run(main())
