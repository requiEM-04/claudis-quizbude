# Spielt jede Kategorie mit zwei Konten durch (nachgebautes Supabase) und macht Bilder davon.
# Start: im Repo-Ordner "python3 -m http.server 8765", dann "python3 werkzeuge/test/kategorientest.py [ordner-fuer-bilder]".
import asyncio, os, sys
from playwright.async_api import async_playwright
HIER = os.path.dirname(os.path.abspath(__file__))
BASIS = 'http://localhost:8765/'
FAKE = open(os.path.join(HIER, 'supabase-fake.js')).read()
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
fehler = []

ANTWORTEN = """async (falsch) => {
  const v = document.getElementById('version').textContent;
  const m = await import('./js/kategorien.js?v=' + v);
  const { LAND } = await import('./js/abgleich.js?v=' + v);
  const r = quizbude.raum; const f = r.frage;
  if (!f || r.phase !== 'frage' || r.meinStatus) return 'nichts';
  if (f.o) {
    const keys = m.optionSchluessel(f);
    const k = keys.find(k => falsch ? !m.richtigeWahl(f, k) : m.richtigeWahl(f, k));
    document.querySelector(`#optionen button[data-c="${CSS.escape(k)}"]`).click();
    return f.k + ' wahl ' + k;
  }
  let text = falsch ? 'Atlantis' : (f.k === 'hauptstaedte' ? LAND[f.c].stadt : LAND[f.c]?.name);
  if (f.k === 'bombe') { const B = (await import('./js/bombe-woerter.js?v=' + v)).BEISPIELE.split(' '); text = falsch ? 'Atlantis' : B.find(w => w.includes(f.s.toLowerCase()) && w !== f.s.toLowerCase() && !m.bombeBenutzt.has(w)); }
  if (f.k === 'schaetzen') { const S = (await import('./js/schaetzen.js?v=' + v)).SCHAETZEN; text = falsch ? '1' : String(S[f.n].a).replace('.', ','); }
  const inp = document.getElementById('rate-eingabe'); inp.value = text; document.getElementById('rate-form').requestSubmit();
  return f.k + ' tippe ' + text;
}"""

async def neu(ctx, url, tag):
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: fehler.append(f'{tag} PAGEERROR {e}'))
    pg.on('console', lambda m: m.type == 'error' and fehler.append(f'{tag} {m.text}'))
    await pg.goto(url); await pg.wait_for_timeout(400)
    return pg

async def registrieren(pg, name, avatar):
    await pg.click('[data-modus=neu]')
    await pg.fill('#anmelde-form [name=name]', name)
    await pg.fill('#anmelde-form [name=passwort]', 'test1234')
    await pg.click('#avatar-wahl button[data-k=""]')
    await pg.click('#anmelde-knopf')
    await pg.wait_for_selector('#s-bude:not([hidden])', timeout=5000)

async def waehle(pg, sel, wert):
    # eigene Klappliste: Knopf öffnen, dann den Eintrag mit dem passenden Index anklicken
    # ein Aufstiegsfenster (Testkonto steigt beim Spielen auf) erst schließen
    if await pg.evaluate("document.getElementById('aufstieg').open"): await pg.click('#aufstieg-weiter')
    i = await pg.eval_on_selector(sel, '(e, w) => [...e.options].findIndex(o => o.value === w)', wert)
    assert i >= 0, (sel, wert)
    await pg.click(f'{sel} + .feld .feld-knopf')
    await pg.click(f'{sel} + .feld li[data-i="{i}"]')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        # Testkonten steigen beim Spielen im Ruhm auf: das Aufstiegsfenster sofort wieder schließen, sonst blockiert es Klicks
        await ctx.add_init_script("setInterval(() => { const d = document.getElementById('aufstieg'); if (d && d.open) d.close(); }, 150)")
        A = await neu(ctx, BASIS, 'A'); await registrieren(A, 'Colin', '🦊')
        B = await neu(ctx, BASIS + '?sitzung=2', 'B'); await registrieren(B, 'Leonie', '🐸')
        await A.screenshot(path=f'{BILDER}/k_bude.png', full_page=True)
        # Raum über die Kachel „Gemischt"
        await A.click('.kachel[data-k=gemischt]')
        await A.wait_for_selector('#p-warten:not([hidden])')
        await B.wait_for_timeout(900)
        print('Lobby:', (await B.inner_text('#raum-liste')).replace('\n', ' | '))
        code = (await A.inner_text('#raum-code')).strip()
        await B.goto(BASIS + '?sitzung=2#/raum/' + code); await B.wait_for_selector('#p-warten:not([hidden])')
        for kat in ['gemischt', 'flaggen', 'umrisse', 'hauptstaedte', 'nachbarn', 'buchstaben', 'bombe', 'groesser', 'mehr', 'schaetzen', 'wissen']:
            await waehle(A, '#einst-kategorie', kat); await A.wait_for_timeout(300)
            await waehle(A, '#einst [data-e=runden]', '10' if kat == 'gemischt' else '5')
            await waehle(A, '#einst [data-e=zeit]', '10'); await A.wait_for_timeout(300)
            if kat == 'gemischt': await A.screenshot(path=f'{BILDER}/k_warten.png')
            print(kat, 'B sieht:', await B.eval_on_selector('#einst-kategorie', 'e => e.value'), '/', await B.eval_on_selector('#einst-auswahl', 'e => e.value'), '/ modus aus:', await B.eval_on_selector('#einst-modus', 'e => e.value'))
            await A.click('#los')
            gesehen = set()
            while True:
                await A.wait_for_function('["frage","ende"].includes(quizbude.raum.phase)', timeout=20000)
                if await A.evaluate('quizbude.raum.phase') == 'ende': break
                idx = await A.evaluate('quizbude.raum.idx'); art = await A.evaluate('quizbude.raum.frage.k')
                await A.wait_for_timeout(500)
                if kat == 'gemischt' and art not in gesehen:
                    await A.screenshot(path=f'{BILDER}/k_frage_{art}.png')
                await B.evaluate(ANTWORTEN, idx % 3 == 1)
                await A.evaluate(ANTWORTEN, False)
                await A.wait_for_function(f'quizbude.raum.phase !== "frage" || quizbude.raum.idx !== {idx}', timeout=15000)
                if kat == 'gemischt' and art not in gesehen:
                    await A.wait_for_timeout(300); await A.screenshot(path=f'{BILDER}/k_aufl_{art}.png'); gesehen.add(art)
            ohne_du = "(() => { const k = document.getElementById('podest').cloneNode(true); k.querySelectorAll('.du').forEach(e => e.remove()); document.body.append(k); const t = k.innerText; k.remove(); return t; })()"
            pa = (await A.evaluate(ohne_du)).replace('\n', ' '); pb = (await B.evaluate(ohne_du)).replace('\n', ' ')
            print(kat, 'Endstand:', pa, '| gleich bei B:', pa == pb, '| Arten:', sorted(gesehen) if gesehen else '')
            await A.click('#andere-kategorie'); await A.wait_for_selector('#p-warten:not([hidden])')
        await A.goto(BASIS + '#/'); await A.wait_for_timeout(800)
        print('FEHLER:', fehler)
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
