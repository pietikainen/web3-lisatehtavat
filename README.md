# web3-lisatehtavat
Savonia AMK - Web-ohjelmointi 3 - lisätehtävät

---

## Käytettävät reitit API:ssa
> ###GET: /api/company

Palauttaa yritykset annetuilla query-parametreilla (nimi, y_tunnus, toimiala_id), tai niiden puuttuessa palauttaa kaikki yritykset.

- nimi (tai nimen alkuosa)
- y-tunnus muodossa 1234567-8 tai 12345678
- toimiala_id

```
   {
        "id": 1,
        "nimi": "TeknoRatkaisut Oy",
        "y_tunnus": "1234567-8",
        "osoite": "Katu 123, Helsinki",
        "toimiala_id": 1,
        "toimiala_selite": "Tietotekniikka",
        "tilaukset_lkm": 2,
        "yht_veroton": 1080.75,
        "yht_verollinen": 1335.285
    }
```

Ilman parametreja haku palauttaa kaikki yritykset.
L1-L3

---

> ###DELETE: /api/company/:id/:param


- Parametri '1': 
    - Poistaa yrityksen ja siihen liittyvät tilaukset tietokannasta "oikeasti".
- Parametri '0': 
    - Muuttaa yrityksen aktiivistatuksen 0 => 1 (inaktiivinen)
- Jos käyttäjä ei anna parametria, käsitellään pyyntöä kuten parametri olisi '0'.

```
{
    "message": "Yritys muutettu inaktiiviseksi tietokannassa."
}
```
```
{
    "message": "Yritys ja tilaukset poistettu tietokannasta onnistuneesti."
}
```

L5-L6

---

> ###POST: /api/order

Ottaa vastaan JSON-muotoisen bodylohkon, sisältäen yrityksen ja tilaukset.
Tilauksia voi olla yksi tai useampi.

```
  {
    "yritys": {
      "nimi": "Seinähullut Veljekset Oyj",
      "y_tunnus": "1222562-3",
      "osoite": "Kotikatu 666",
      "toimiala_id": 2
    },
    "tilaus": [
      {
        "veroton_hinta": 25,
        "toimituspvm": "2023-05-20",
        "otsikko": "Kauppatavaraa",
        "vero_prosentti": 1
      },
      {
        "veroton_hinta": 10,
        "toimituspvm": "2013-05-21",
        "otsikko": "Ostolaskutus #123823",
        "vero_prosentti": 24
      }
    ]
  }
```

```
{
    "message": "Yritys ja tilaukset lisätty tietokantaan."
}
```
Tarkastaa kaikkien kenttien olemassaolon, sekä suorittaa virheentarkistuksia y-tunnukseen, kokonaislukuihin, sekä toimituspäivään.
Palauttaa tarvittaessa virheilmoituksia.

```
{
    "error": "Seuraavissa kentissä oli virheelliset arvot: Virheellinen Y-tunnus,Virheellinen toimiala"
}
```
```
{
    "error": "Seuraavissa kentissä oli virheelliset arvot: Virheellinen veroton hinta,Virheellinen veroprosentti"
}
```

> ### PUT: /api/order/:id
Päivittää yrityksen tilausten toimituspäivämääräksi parametrina annetun päivämäärän (yyyy-mm-dd).
Ottaa vastaan yhden tai useampia tilauksia.

Parametrit: 
- :id (yrityksen id)
- bodylohko
```
[{ "tilausid": 53, "toimituspvm": "2024-05-21"}, {"tilausid": 54, "toimituspvm": "2025-05-21"}]
```

Palauttaa JSON-muodossa tiedot päivitetystä tilauksesta, (id, alkup. toimituspäivä ja uusi toimituspäivä)
```
{
    "updatedOrderInfo": [
        {
            "tilausid": 53,
            "toimituspvm_original": "2026-05-05T21:00:00.000Z",
            "toimituspvm_uusi": "2024-05-21"
        },
        {
            "tilausid": 54,
            "toimituspvm_original": "2026-05-05T21:00:00.000Z",
            "toimituspvm_uusi": "2025-05-21"
        }
    ]
}
```

Jos toimitus on jo tapahtunut (toimituspvm < nykyinen pvm), palautetaan virheilmoitus eikä muutoksia tehdä.

```
{
    "error": "Kaikki tilaukset on jo toimitettu. Muutoksia ei voi tehdä."
}
```


