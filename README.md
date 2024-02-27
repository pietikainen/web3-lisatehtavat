# web3-lisatehtavat
Savonia AMK - Web-ohjelmointi 3 - lisätehtävät

---

## Käytettävät reitit API:ssa
> GET: /api/company

Palauttaa yritykset annetuilla query-parametreilla (nimi, y_-_tunnus, toimiala_id), tai niiden puuttuessa palauttaa kaikki yritykset.

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

---

> DELETE: /api/company/:id/:param


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

---




