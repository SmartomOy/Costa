# Trimmaamo Costa – verkkosivut

Yhden sivun verkkosivut Trimmaamo Costalle. Rakennettu [Astrolla](https://astro.build),
animaatiot [GSAP](https://gsap.com):llä (ScrollTrigger, SplitText) ja pehmeä vieritys
[Lenisillä](https://lenis.darkroom.engineering).

## Tietojen päivittäminen

**Kaikki sivun tiedot ovat yhdessä tiedostossa: [`src/data/site.ts`](src/data/site.ts).**
Rivit, joissa on merkintä `// PAIKKATIETO`, ovat esimerkkejä ja ne kannattaa vaihtaa:

- osoite, puhelinnumero, sähköposti, Y-tunnus ja some-linkit
- avajaispäivä (`openingDate`) – laskuri vaihtuu automaattisesti "Olemme auki!" -tilaan
- aukioloajat, palvelut, hinnat koon mukaan ja lisäpalvelut
- Meistä-teksti ja trimmarin nimi

### Kuvat

- **Galleria:** lisää kuvat kansioon `src/assets/gallery/` ja tuo ne `site.ts`:n
  `gallery`-listaan (ohje tiedostossa). Ilman kuvaa näytetään tyylitelty paikkakuva.
- **Ennen & jälkeen:** lisää kaksi samasta kulmasta otettua kuvaa `beforeAfter`-kohtaan.
- **Meistä-kuva:** vaihda `src/components/About.astro`-tiedoston kuva trimmarin omaan kuvaan.
- **Logo:** koiranpää on irrotettu logon kuvakaappauksesta skriptillä
  `npm run prepare-logo -- polku/logoon.png`. Jos saatavilla on alkuperäinen,
  korkearesoluutioinen logo, sen voi ajaa saman skriptin läpi (rajausalueet skriptissä).

## Kehitys

```sh
npm install
npm run dev       # kehityspalvelin: http://localhost:4321
npm run build     # tuotantoversio kansioon dist/
npm run preview   # tuotantoversion esikatselu
npm run check     # tyyppitarkistus
```

## Julkaisu

`.github/workflows/deploy.yml` julkaisee sivuston GitHub Pagesiin aina, kun `main`-haaraan
tulee muutoksia. Ota käyttöön repon asetuksista: **Settings → Pages → Source: GitHub Actions**.

Oletuksena sivu toimii osoitteessa `https://<omistaja>.github.io/<repo>/`. Omaa domainia varten
lisää repon muuttujiin (**Settings → Secrets and variables → Actions → Variables**)
`SITE_URL`, esim. `https://www.trimmaamocosta.fi`, ja aseta domain Pages-asetuksissa.

Sivusto on täysin staattinen (kansio `dist/`), joten sen voi julkaista myös esim. Netlifyssä,
Vercelissä tai millä tahansa webhotellilla.

## Saavutettavuus ja suorituskyky

- Animaatiot kytkeytyvät pois, jos käyttäjä on valinnut käyttöjärjestelmästä vähennetyn liikkeen.
- Sivu toimii myös ilman JavaScriptiä (sisältö ja hinnat näkyvät).
- Fontit ovat itse hostattuja, eikä sivu käytä evästeitä tai seurantaa.
