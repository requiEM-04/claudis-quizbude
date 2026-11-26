# Emotes im Raum-Chat: Liste, Tab-Ergänzen, Anzeige bei beiden, gesperrte bleiben Wort, Anpassen-Reiter, Ruhmesweg.
# Start: im Repo-Ordner "python3 -m http.server 8765", dann "python3 werkzeuge/test/emotetest.py [ordner-fuer-bilder]".
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kategorientest import neu, registrieren, BASIS, FAKE, fehler
from playwright.async_api import async_playwright
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'

async def chat(pg, text):
    await pg.fill('#chat-eingabe', text); await pg.press('#chat-eingabe', 'Enter'); await pg.wait_for_timeout(400)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script("setInterval(() => { const d = document.getElementById('aufstieg'); if (d && d.open) d.close(); }, 150)")
        A = await neu(ctx, BASIS, 'A'); await registrieren(A, 'Colin', '🦊')
        B = await neu(ctx, BASIS + '?sitzung=2', 'B'); await registrieren(B, 'Leonie', '🐸')
        await A.click('.kachel[data-k=flaggen]'); await A.wait_for_selector('#p-warten:not([hidden])')
        code = (await A.inner_text('#raum-code')).strip()
        await B.goto(BASIS + '?sitzung=2#/raum/' + code); await B.wait_for_selector('#p-warten:not([hidden])'); await A.wait_for_timeout(800)
        # Liste öffnen, freies Emote einsetzen, gesperrtes meldet sich
        await A.click('#emote-knopf'); await A.wait_for_timeout(200)
        print('Liste offen:', not await A.evaluate("document.getElementById('emote-liste').hidden"), '| frei:', await A.eval_on_selector_all('.el-emote:not(.zu)', 'l => l.length'), '| gesperrt:', await A.eval_on_selector_all('.el-emote.zu', 'l => l.length'))
        await A.screenshot(path=f'{BILDER}/em_liste.png')
        await A.fill('#chat-eingabe', 'Na'); await A.click('.el-emote[data-emote=lol]')
        print('Nach Klick:', repr(await A.input_value('#chat-eingabe')), '| Liste noch offen:', not await A.evaluate("document.getElementById('emote-liste').hidden"))
        await A.click('.el-emote[data-emote=krone]', force=True); await A.wait_for_timeout(200)
        print('Gesperrt-Hinweis:', await A.inner_text('#toast'))
        await A.keyboard.press('Escape'); await A.wait_for_timeout(150)
        print('Escape schließt:', await A.evaluate("document.getElementById('emote-liste').hidden"))
        await A.press('#chat-eingabe', 'Enter'); await A.wait_for_timeout(500)
        # Tab ergänzt und blättert
        await A.fill('#chat-eingabe', 'gut gemacht qbg'); await A.press('#chat-eingabe', 'Tab')
        print('Tab qbg ->', repr(await A.input_value('#chat-eingabe')))
        await A.fill('#chat-eingabe', 'qbl'); await A.press('#chat-eingabe', 'Tab'); t1 = await A.input_value('#chat-eingabe')
        await A.press('#chat-eingabe', 'Tab'); t2 = await A.input_value('#chat-eingabe')
        print('Tab qbl ->', repr(t1), 'nochmal ->', repr(t2), '| Fokus bleibt:', await A.evaluate("document.activeElement.id"))
        await A.fill('#chat-eingabe', 'qbkro'); await A.press('#chat-eingabe', 'Tab')
        print('Tab gesperrtes qbkro ->', repr(await A.input_value('#chat-eingabe')), '| Fokus:', await A.evaluate("document.activeElement.id"))
        await A.focus('#chat-eingabe')
        await chat(A, 'qbGG qbGG')
        await chat(B, 'nächste Runde qbWut qbKrone')
        await B.wait_for_timeout(400); await A.wait_for_timeout(400)
        for n, pg in [('A', A), ('B', B)]:
            zeilen = await pg.eval_on_selector_all('#chat-liste li:not(.system)', 'l => l.slice(-3).map(li => [li.className, li.querySelectorAll("img.emote").length, li.textContent.trim().slice(-30)])')
            print(n, 'sieht:', zeilen)
        await A.screenshot(path=f'{BILDER}/em_chat.png')
        print('Größe nur Emotes:', await A.evaluate("document.querySelector('#chat-liste li.nur-emotes img.emote')?.getBoundingClientRect().width"), '| im Text:', await A.evaluate("[...document.querySelectorAll('#chat-liste li:not(.nur-emotes) img.emote')].pop()?.getBoundingClientRect().width"))
        print('Bild geladen:', await A.evaluate("[...document.querySelectorAll('#chat-liste img.emote')].every(i => i.complete && i.naturalWidth > 0)"))
        # Mit Ruhm: Leonie hätte Kreuz-Ass, dann zeigt A auch qbKrone als Bild
        await A.evaluate("(() => { for (const [, p] of quizbude.raum.bekannt) if (p.name === 'Leonie') p.ruhm = 7000; })()")
        await chat(A, 'ok')
        print('Mit Ruhm 7000 bei Leonie:', await A.eval_on_selector_all('#chat-liste li:not(.system)', 'l => l.filter(li => li.textContent.includes("Leonie")).map(li => [...li.querySelectorAll("img.emote")].map(i => i.alt))'))
        # Liste klappt nach unten, wenn oben kein Platz ist
        await A.click('#emote-knopf'); await A.wait_for_timeout(200)
        r = await A.evaluate("(() => { const l = document.getElementById('emote-liste').getBoundingClientRect(); return [document.getElementById('emote-liste').className, Math.round(l.top), Math.round(l.bottom), innerHeight]; })()")
        print('Liste:', r); await A.screenshot(path=f'{BILDER}/em_liste.png'); await A.keyboard.press('Escape')
        # Anpassen-Reiter
        await A.evaluate("location.hash = '#/profil'"); await A.wait_for_selector('#s-profil:not([hidden])'); await A.wait_for_timeout(500)
        await A.evaluate("document.querySelector('[data-tab=anpassen], [data-ptab=anpassen], .profil-reiter [data-tab=\"anpassen\"]')?.click()"); await A.wait_for_timeout(300)
        await A.evaluate("document.querySelector('#anpassen-reiter [data-art=emote]')?.click()"); await A.wait_for_timeout(400)
        print('Anpassen Emotes:', await A.eval_on_selector_all('#stil-kacheln .emote-kachel', 'l => l.length'), '| gesperrt:', await A.eval_on_selector_all('#stil-kacheln .emote-kachel.gesperrt', 'l => l.length'), '| Reiter:', (await A.inner_text('#anpassen-reiter [data-art=emote]')).replace('\n', ' '))
        await A.screenshot(path=f'{BILDER}/em_anpassen.png', full_page=True)
        await A.evaluate("document.querySelector('#profil-reiter [data-tab=ruhm]')?.click()"); await A.wait_for_timeout(300)
        rw = await A.inner_text('#ruhmesweg')
        print('Ruhmesweg nennt:', [c for c in ['qbCool', 'qbZzz', 'qbKrone', 'qbJackpot'] if c in rw])
        print('FEHLER:', fehler)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
