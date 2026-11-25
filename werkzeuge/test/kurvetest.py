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
        Bp = await ctx.new_page(); Bp.on('pageerror', lambda e: fehler.append('B ' + str(e))); await Bp.goto(B + '?sitzung=2'); await Bp.wait_for_timeout(300); await reg(Bp, 'Leonie')
        await A.click('#kachel-raster .kachel[data-k=spiele]'); await A.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(400)
        print('Standardspiel:', await A.evaluate('quizbude.raum.einst.auswahl'), '|', await A.inner_text('#los-hinweis'))
        code = await A.inner_text('#raum-code'); await Bp.goto(B + '?sitzung=2#/raum/' + code); await Bp.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(600)
        await A.click('#los'); await A.wait_for_timeout(1000)
        print('Countdown B:', (await Bp.inner_text('#spiel-countdown')).replace('\n', ' '))
        await A.wait_for_function('quizbude.raum.phase === "spiel" && quizbude.raum.kurve', timeout=8000)
        await A.evaluate('quizbude.raum.kurve.ziel = 2')
        await Bp.wait_for_function('quizbude.raum.phase === "spiel"', timeout=5000)
        await A.wait_for_timeout(1700)  # Bereit-Phase vorbei
        # B hält links, A hält rechts
        await Bp.keyboard.down('ArrowLeft'); await A.keyboard.down('d')
        await A.wait_for_timeout(1200)
        st = await A.evaluate('JSON.stringify(quizbude.raum.kurve.s.map(s => [Math.round(s.a*100)/100, s.lebt]))')
        print('Winkel nach Halten (A rechts, B links):', st)
        await Bp.keyboard.up('ArrowLeft'); await A.keyboard.up('d')
        await A.screenshot(path='/tmp/qbtest/k_spiel_a.png'); await Bp.screenshot(path='/tmp/qbtest/k_spiel_b.png')
        print('B gezeigt bis Schritt', await Bp.evaluate('quizbude.raum.kurvenBild.gezeigtT'), 'von', await A.evaluate('quizbude.raum.kurve.t'))
        print('Info:', (await Bp.inner_text('#spiel-info')).replace('\n', ' '), '|', await Bp.inner_text('#raum-runde'))
        # Powerup direkt vor A legen und einsammeln lassen
        await A.evaluate('''() => { const k = quizbude.raum.kurve; const s = k.s[0]; if (s.lebt) k.pu.push({ n: 99, typ: 'dick', x: s.x + Math.cos(s.a)*8, y: s.y + Math.sin(s.a)*8 }); }''')
        await A.wait_for_timeout(300)
        print('Powerup dick bei B aktiv:', await A.evaluate('(() => { const k = quizbude.raum.kurve; return k.aktiv(k.s[1], "dick") })()'))
        await A.wait_for_function('quizbude.raum.phase === "ende"', timeout=60000)
        await Bp.wait_for_function('quizbude.raum.phase === "ende"', timeout=5000); await A.wait_for_timeout(400)
        print('Ende:', await A.inner_text('#ende-titel'), '|', (await A.inner_text('#podest')).replace('\n', ' '), '| Runden gespielt:', await A.evaluate('quizbude.raum.kurvenBild.lage.runde'))
        await A.screenshot(path='/tmp/qbtest/k_ende.png')
        print('Fehler:', fehler); await b.close()
asyncio.run(main())
