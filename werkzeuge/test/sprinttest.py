# Sprint je Kategorie, Profil, Zurück-Taste und Start-Regel (ab 2 Leuten), mit nachgebautem Supabase.
# Start: im Repo-Ordner "python3 -m http.server 8765", dann "python3 werkzeuge/test/sprinttest.py [ordner-fuer-bilder]".
import asyncio, os, sys
from playwright.async_api import async_playwright
HIER = os.path.dirname(os.path.abspath(__file__))
BASIS = 'http://localhost:8765/'
FAKE = open(os.path.join(HIER, 'supabase-fake.js')).read()
BILDER = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
fehler = []

ANTWORT = """async (falsch) => {
  const v = document.getElementById('version').textContent;
  const m = await import('./js/kategorien.js?v=' + v);
  const { LAND } = await import('./js/abgleich.js?v=' + v);
  const s = quizbude.sprint; const f = s?.frage;
  if (!f || !s.laeuft) return 'nichts';
  if (f.o) {
    const k = m.optionSchluessel(f).find(k => falsch ? !m.richtigeWahl(f, k) : m.richtigeWahl(f, k));
    document.querySelector(`#sprint-optionen button[data-c="${CSS.escape(k)}"]`).click();
    return f.k + (falsch ? ' falsch' : ' richtig');
  }
  const inp = document.getElementById('sprint-eingabe');
  inp.value = falsch ? 'Atlantis' : (f.k === 'hauptstaedte' ? LAND[f.c].stadt : LAND[f.c].name);
  document.getElementById('sprint-form').requestSubmit();
  return f.k + ' tippe';
}"""

async def waehle(pg, sel, wert):
    # eigene Klappliste: Knopf öffnen, dann den Eintrag mit dem passenden Index anklicken
    i = await pg.eval_on_selector(sel, '(e, w) => [...e.options].findIndex(o => o.value === w)', wert)
    assert i >= 0, (sel, wert)
    await pg.click(f'{sel} + .feld .feld-knopf')
    await pg.click(f'{sel} + .feld li[data-i="{i}"]')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route('**/vendor/supabase.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: fehler.append(f'PAGEERROR {e}'))
        pg.on('console', lambda m: m.type == 'error' and fehler.append(m.text))
        await pg.goto(BASIS); await pg.wait_for_timeout(400)
        await pg.click('[data-modus=neu]'); await pg.fill('#anmelde-form [name=name]', 'Colin'); await pg.fill('#anmelde-form [name=passwort]', 'test1234')
        await pg.click('#avatar-wahl [data-a="🦊"]'); await pg.click('#anmelde-knopf'); await pg.wait_for_selector('#s-bude:not([hidden])')

        # Sprint-Reiter unten im Dock
        await pg.screenshot(path=f'{BILDER}/s_bude.png')
        await pg.click('.dock-link[data-nav=sprint]'); await pg.wait_for_selector('#s-sprintwahl:not([hidden])')
        print('Sprint-Reiter:', await pg.evaluate('location.hash'), '| aktiv:', await pg.inner_text('.dock-link.aktiv'))
        print('Kachel-Text:', (await pg.inner_text('#sprint-kacheln .kachel[data-k=umrisse] .sk-rekord')))
        await pg.screenshot(path=f'{BILDER}/s_sprintwahl.png')

        for kat in ['umrisse', 'wissen', 'groesser']:
            await pg.click(f'#sprint-kacheln .kachel[data-k={kat}]')
            await pg.wait_for_function('quizbude.sprint && quizbude.sprint.laeuft', timeout=8000)
            print(kat, 'Adresse:', await pg.evaluate('location.hash'), '| Tiefe:', await pg.evaluate('history.state && history.state.qbTiefe'))
            for i in range(6):
                await pg.wait_for_timeout(250)
                r = await pg.evaluate(ANTWORT, i == 2)
                if i == 1: await pg.screenshot(path=f'{BILDER}/s_sprint_{kat}.png')
                if i == 2 and r.endswith('falsch'): await pg.wait_for_timeout(1000)
            vorher = await pg.evaluate('quizbude.sprint.ende - performance.now()')
            await pg.click('#sprint-skip'); await pg.wait_for_timeout(150)
            nachher = await pg.evaluate('quizbude.sprint.ende - performance.now()')
            print(kat, 'Überspringen kostet:', round((vorher - nachher) / 1000), 's')
            f1 = await pg.evaluate('JSON.stringify(quizbude.sprint.frage)')
            await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(150)
            f2 = await pg.evaluate('JSON.stringify(quizbude.sprint.frage)')
            await pg.keyboard.press('Alt+d'); await pg.wait_for_timeout(150)
            f3 = await pg.evaluate('JSON.stringify(quizbude.sprint.frage)')
            print(kat, 'Pfeil rechts überspringt:', f1 != f2, '| Alt+D überspringt:', f2 != f3)
            if kat == 'wissen':
                vor = await pg.evaluate('quizbude.sprint.punkte')
                richtig = await pg.evaluate('''async () => { const v = document.getElementById('version').textContent; const m = await import('./js/kategorien.js?v=' + v); const f = quizbude.sprint.frage; return m.optionSchluessel(f).findIndex(k => m.richtigeWahl(f, k)) + 1; }''')
                await pg.keyboard.press(str(richtig)); await pg.wait_for_timeout(150)
                print(kat, 'Taste', richtig, 'wählt richtige Antwort:', await pg.evaluate('quizbude.sprint.punkte') == vor + 1)
            offen = await pg.evaluate('quizbude.sprint.frage')
            await pg.evaluate('quizbude.sprint.ende = performance.now() + 200')
            await pg.wait_for_selector('#sp-ende:not([hidden])', timeout=5000); await pg.wait_for_timeout(400)
            verpasst = await pg.evaluate('quizbude.sprint.verpasst')
            print(kat, 'Ergebnis:', await pg.inner_text('#sprint-ergebnis'), '|', await pg.inner_text('#sprint-rekord'),
                  '| ausgelassen:', len(verpasst), '| offene Frage dabei:', offen in verpasst)
            await pg.screenshot(path=f'{BILDER}/s_ende_{kat}.png')
            await pg.go_back(); await pg.wait_for_timeout(500)
            print(kat, 'nach Zurück:', await pg.evaluate('location.hash'), [s for s in ['s-bude', 's-sprint', 's-sprintwahl'] if not await pg.evaluate(f'document.getElementById("{s}").hidden')])
        print('Kachel-Text danach:', await pg.inner_text('#sprint-kacheln .kachel[data-k=umrisse] .sk-rekord'))
        # Raus aus laufendem Sprint -> Auswahl, dann Zurück -> Bude
        await pg.click('#sprint-kacheln .kachel[data-k=flaggen]'); await pg.wait_for_function('quizbude.sprint && quizbude.sprint.laeuft', timeout=8000)
        await pg.click('#s-sprint a.knopf[href="#/sprint"]'); await pg.wait_for_timeout(400)
        print('Raus im Sprint ->', await pg.evaluate('location.hash'), '| Sprint läuft noch:', await pg.evaluate('!!quizbude.sprint'))
        await pg.go_back(); await pg.wait_for_timeout(400)
        print('dann Zurück ->', await pg.evaluate('location.hash'), '| Bude:', not await pg.evaluate('document.getElementById("s-bude").hidden'))

        # Nachschlagen
        await pg.click('.dock-link[data-nav=lernen]'); await pg.wait_for_selector('#s-lernen:not([hidden])'); await pg.wait_for_timeout(300)
        print('Lernen:', await pg.inner_text('#lernen-anzahl'))
        await pg.screenshot(path=f'{BILDER}/s_lernen.png')
        await pg.fill('#lernen-suche', 'kairo'); await pg.wait_for_timeout(200)
        print('Suche kairo:', (await pg.inner_text('#lernen-raster')).replace('\n', ' '))
        await pg.fill('#lernen-suche', ''); await pg.click('#lernen-region [data-r=afrika]'); await pg.click('#lernen-art [data-art=umrisse]'); await pg.wait_for_timeout(1200)
        print('Afrika Umrisse:', await pg.inner_text('#lernen-anzahl'), '| svgs:', await pg.eval_on_selector_all('#lernen-raster svg', 'e => e.length'))
        await pg.screenshot(path=f'{BILDER}/s_lernen_umrisse.png')
        await pg.click('#lernen-raster .lern-karte[data-c=CI]'); await pg.wait_for_timeout(400)
        print('Detail:', (await pg.inner_text('#lernen-detail-inhalt')).replace('\n', ' '))
        await pg.screenshot(path=f'{BILDER}/s_lernen_detail.png')
        await pg.keyboard.press('Escape'); await pg.go_back(); await pg.wait_for_timeout(400)
        print('Lernen -> Zurück:', await pg.evaluate('location.hash'))

        # Bestenliste Sprint je Kategorie
        await pg.click('#besten-reiter [data-spalte=sprint]'); await waehle(pg, '#besten-kategorie', 'wissen'); await pg.wait_for_timeout(300)
        await pg.click('#besten-kategorie + .feld .feld-knopf'); await pg.wait_for_timeout(200)
        await pg.evaluate('document.querySelector(".bude-raster").scrollIntoView()'); await pg.screenshot(path=f'{BILDER}/s_klappliste.png')
        await pg.keyboard.press('Escape')
        print('Sprint-Bestenliste Wissen:', (await pg.inner_text('#besten-liste')).replace('\n', ' '))

        # Profil über das Dock
        await pg.click('.dock-ich'); await pg.wait_for_selector('#s-profil:not([hidden])'); await pg.wait_for_timeout(600)
        print('Profil:', await pg.inner_text('#profil-name'), '|', (await pg.inner_text('#profil-werte')).replace('\n', ' '))
        print('Rekorde:', (await pg.inner_text('#profil-rekorde')).replace('\n', ' '))
        await pg.screenshot(path=f'{BILDER}/s_profil.png', full_page=True)
        await pg.click('#profil-bearbeiten'); await pg.click('#profil-avatar-wahl [data-a="🦉"]'); await pg.click('#profil-speichern'); await pg.wait_for_timeout(300)
        print('Avatar im Dock:', await pg.inner_text('.dock-ich .avatar'))
        await pg.go_back(); await pg.wait_for_timeout(400)
        print('Profil -> Zurück:', await pg.evaluate('location.hash'), 'Bude sichtbar:', not await pg.evaluate('document.getElementById("s-bude").hidden'))

        # Raum allein: Start gesperrt
        await pg.click('#kachel-raster .kachel[data-k=flaggen]'); await pg.wait_for_selector('#p-warten:not([hidden])'); await pg.wait_for_timeout(500)
        print('Los gesperrt allein:', await pg.eval_on_selector('#los', 'e => e.disabled'), '|', await pg.inner_text('#los-hinweis'))
        await waehle(pg, '#einst-kategorie', 'umrisse'); await pg.wait_for_timeout(200)
        await pg.click('#einst-kategorie + .feld .feld-knopf'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'{BILDER}/s_einst_klappliste.png')
        await pg.keyboard.press('Escape')
        await pg.screenshot(path=f'{BILDER}/s_raum_allein.png')
        await pg.click('a.knopf[href="#/"]'); await pg.wait_for_timeout(400)
        print('Raus -> ', await pg.evaluate('location.hash'), '| Tiefe:', await pg.evaluate('history.state && history.state.qbTiefe'))

        # Direktlink in einen Raum: Zurück führt in die Bude
        pg2 = await ctx.new_page(); await pg2.goto(BASIS + '#/raum/ABCD'); await pg2.wait_for_selector('#p-warten:not([hidden])', timeout=8000)
        await pg2.go_back(); await pg2.wait_for_timeout(500)
        print('Direktlink -> Zurück:', await pg2.evaluate('location.href'), 'Bude:', not await pg2.evaluate('document.getElementById("s-bude").hidden'))
        print('FEHLER:', fehler)
        await b.close()
asyncio.run(main())
