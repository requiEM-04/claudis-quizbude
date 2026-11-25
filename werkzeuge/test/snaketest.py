import asyncio
from playwright.async_api import async_playwright
FAKE = open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'supabase-fake.js')).read()
B = 'http://localhost:8765/'
async def reg(pg, name):
    await pg.click('[data-modus=neu]'); await pg.fill('#anmelde-form [name=name]', name); await pg.fill('#anmelde-form [name=passwort]', 'test1234')
    await pg.click('#anmelde-knopf'); await pg.wait_for_selector('#s-bude:not([hidden])')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1366, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        fehler = []
        A = await ctx.new_page(); A.on('pageerror', lambda e: fehler.append('A ' + str(e))); A.on('console', lambda m: m.type == 'error' and fehler.append('A ' + m.text))
        await A.goto(B); await A.wait_for_timeout(300); await reg(A, 'Colin')
        await A.screenshot(path='/tmp/qbtest/g_bude.png')
        Bp = await ctx.new_page(); Bp.on('pageerror', lambda e: fehler.append('B ' + str(e))); await Bp.goto(B + '?sitzung=2'); await Bp.wait_for_timeout(300); await reg(Bp, 'Leonie')
        await A.click('#kachel-raster .kachel[data-k=spiele]'); await A.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(500)
        await A.evaluate("const s=document.querySelector('#einst [data-e=auswahl]'); s.value='snake'; s.dispatchEvent(new Event('change'))"); await A.wait_for_timeout(400)
        print('Allein:', await A.eval_on_selector('#los', 'e => e.disabled'), '|', await A.inner_text('#los-hinweis'), '| Runden sichtbar:', await A.is_visible('#einst [data-e=runden]'), '| Titel:', await A.inner_text('#einst-auswahl-titel'))
        await A.screenshot(path='/tmp/qbtest/g_warten.png')
        code = await A.inner_text('#raum-code'); await Bp.goto(B + '?sitzung=2#/raum/' + code); await Bp.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(600)
        print('Zu zweit, Los frei:', not await A.eval_on_selector('#los', 'e => e.disabled'))
        await A.click('#los'); await A.wait_for_timeout(1200)
        print('Countdown:', (await A.inner_text('#spiel-countdown')).replace('\n', ' '), '| B:', (await Bp.inner_text('#spiel-countdown')).replace('\n', ' '))
        await A.screenshot(path='/tmp/qbtest/g_countdown.png')
        await A.wait_for_function('quizbude.raum.phase === "spiel"', timeout=6000)
        await Bp.wait_for_function('quizbude.raum.phase === "spiel"', timeout=6000)
        # A (links, nach rechts) lenkt nach unten, B lenkt per Taste nach oben
        await A.keyboard.press('ArrowDown'); await Bp.keyboard.press('w')
        await A.wait_for_timeout(1500)
        st = await Bp.evaluate('JSON.stringify(quizbude.raum.snake.schlangen.map(s => [s.r, s.lebt, s.k.length]))')
        print('Nach Lenken (B sieht):', st, '| t A/B:', await A.evaluate('quizbude.raum.snake.t'), await Bp.evaluate('quizbude.raum.snake.t'))
        await A.screenshot(path='/tmp/qbtest/g_spiel.png')
        print('Kopf:', await A.inner_text('#raum-runde'), '|', (await A.inner_text('#spiel-info')).replace('\n', ' '))
        await A.wait_for_function('quizbude.raum.phase === "ende"', timeout=30000)
        await Bp.wait_for_function('quizbude.raum.phase === "ende"', timeout=5000); await A.wait_for_timeout(500)
        print('Ende A:', await A.inner_text('#ende-titel'), '|', (await A.inner_text('#podest')).replace('\n', ' '), '| B:', await Bp.inner_text('#ende-titel'))
        await A.screenshot(path='/tmp/qbtest/g_ende.png')
        await A.click('#nochmal'); await A.wait_for_timeout(500)
        print('Nochmal ->', await A.evaluate('quizbude.raum.phase'), await Bp.evaluate('quizbude.raum.phase'))
        print('Fehler:', fehler); await b.close()
asyncio.run(main())
