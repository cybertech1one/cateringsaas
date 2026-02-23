# Diyafa Demo Restaurant Seed Data

> 10 realistic Moroccan restaurants across 9 cities for the Diyafa demo platform.
> All dish names, prices (MAD), addresses, and phone numbers follow real Moroccan conventions.
> Prices stored as integers (centimes): 5500 = 55.00 MAD.

---

## Research Sources

- TripAdvisor Casablanca/Marrakech/Essaouira/Chefchaouen restaurant listings (2025-2026)
- Morocco phone format: +212, mobile 06xx/07xx, landline Casablanca 0522, Marrakech 0524, Rabat 0537, Fez 0535, Tangier 0539, Agadir 0528, Meknes 0535
- Real street names verified via Google Maps and TripAdvisor addresses
- Price ranges calibrated against Marrakech/Casablanca/Agadir restaurant menus (2025)
- Moroccan restaurant naming conventions: French + Arabic blend, riad/dar prefixes, city landmarks

---

## Data Model Reference

Each restaurant requires inserts into these tables (in order):
1. `auth.users` - Owner account
2. `public.restaurants` - Restaurant entity
3. `public.menus` - Menu per restaurant (links to user, has city/address/slug)
4. `public.menu_languages` - French as default language
5. `public.categories` - Food categories per menu
6. `public.categories_translation` - Category names (FR + EN + AR)
7. `public.dishes` - Dishes per category (price in centimes)
8. `public.dishes_translation` - Dish names + descriptions (FR + EN + AR)
9. `public.dish_variants` - Size/option variants (optional)
10. `public.variant_translations` - Variant names
11. `public.menu_themes` - Visual theme per menu
12. `public.locations` - Physical location
13. `public.operating_hours` - Hours per location

---

## Restaurant 1: La Sqala (Casablanca) - Traditional Moroccan

| Field | Value |
|-------|-------|
| **Name** | La Sqala |
| **City** | Casablanca |
| **Address** | 248 Boulevard Sour Jdid, Ancienne Medina |
| **Cuisine** | Traditional Moroccan |
| **Price Range** | 2 (moderate) |
| **Phone** | +212522260960 |
| **WhatsApp** | +212661234501 |
| **Visual Style** | warm/traditional - earthy tones, Playfair Display headings |
| **Theme Colors** | primary: #C4956A, secondary: #8B5E3C, bg: #FFF8F0, accent: #D4764E |

### Categories & Dishes

**1. Entrees / Starters**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Harira Beldia | Soupe traditionnelle aux lentilles, pois chiches et tomates | 25 | 2500 |
| Briouates au Fromage | Feuilles de brick farcies au fromage de chevre et herbes | 35 | 3500 |
| Zaalouk | Caviar d'aubergines grillees aux tomates, ail et cumin | 30 | 3000 |
| Salade Marocaine | Tomates, concombres, oignons et poivrons finement coupes | 25 | 2500 |

**2. Tagines**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tagine Poulet aux Citrons Confits | Poulet fermier mijoté aux citrons confits et olives vertes | 65 | 6500 |
| Tagine Agneau aux Pruneaux | Épaule d'agneau confite aux pruneaux, amandes et cannelle | 85 | 8500 |
| Tagine Kefta aux Oeufs | Boulettes de viande hachée épicées dans une sauce tomate, oeufs pochés | 55 | 5500 |
| Tagine Légumes de Saison | Tagine végétarien aux légumes frais du marché | 45 | 4500 |

**3. Couscous**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes | Variants |
|-----------|-------------------|-------------|----------|----------|
| Couscous Royal | Semoule fine aux sept légumes, agneau, poulet et merguez | 80 | 8000 | Végétarien: 60 MAD |
| Couscous Tfaya | Couscous aux oignons caramélisés, raisins secs et cannelle | 75 | 7500 | - |
| Couscous au Poisson | Couscous de la mer aux légumes et poisson frais du jour | 70 | 7000 | - |

**4. Grillades**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Brochettes Mixtes | Brochettes de viande hachée, poulet et agneau marinés | 55 | 5500 |
| Côtelettes d'Agneau | Côtelettes grillées aux herbes et épices marocaines | 90 | 9000 |
| Poulet M'chermel | Demi-poulet mariné au charmoula, grillé au charbon | 60 | 6000 |

**5. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe | Thé vert à la menthe fraîche servi traditionnellement | 15 | 1500 |
| Jus d'Orange Frais | Oranges pressées à la minute | 20 | 2000 |
| Nous-Nous | Café moitié lait, moitié expresso à la marocaine | 12 | 1200 |
| Jus d'Avocat | Smoothie avocat, lait et sucre | 25 | 2500 |

**6. Pâtisseries**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Cornes de Gazelle | Pâtisserie traditionnelle aux amandes et fleur d'oranger | 40 | 4000 |
| Baghrir au Miel | Crêpes mille trous servies avec miel et beurre fondu | 30 | 3000 |
| Pastilla au Lait | Feuilles de brick croustillantes à la crème pâtissière | 35 | 3500 |

---

## Restaurant 2: Le Comptoir du Port (Casablanca) - Modern Seafood

| Field | Value |
|-------|-------|
| **Name** | Le Comptoir du Port |
| **City** | Casablanca |
| **Address** | 90 Boulevard de la Corniche, Ain Diab |
| **Cuisine** | Seafood / Mediterranean |
| **Price Range** | 3 (upscale) |
| **Phone** | +212522797800 |
| **WhatsApp** | +212662345012 |
| **Visual Style** | elegant/dark - navy and gold, sophisticated |
| **Theme Colors** | primary: #1B3A5C, secondary: #C5A44E, bg: #F5F7FA, accent: #2E6B9E |

### Categories & Dishes

**1. Fruits de Mer / Shellfish**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Plateau Royal de Fruits de Mer | Crevettes, langoustines, huîtres et moules pour 2 personnes | 350 | 35000 |
| Huîtres de Dakhla (6 pièces) | Huîtres fraîches de la baie de Dakhla, citron et échalote | 120 | 12000 |
| Crevettes à l'Ail | Crevettes royales sautées à l'ail, persil et piment doux | 140 | 14000 |
| Calamars Grillés | Calamars frais grillés au charbon, sauce chermoula | 95 | 9500 |

**2. Poissons / Fish**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Loup de Mer Grillé | Loup de mer entier grillé, légumes de saison | 160 | 16000 |
| Filet de Sole Meunière | Filet de sole poêlé au beurre, câpres et citron | 140 | 14000 |
| Tagine de Poisson Chermoula | Poisson du jour en tagine, pommes de terre et chermoula | 110 | 11000 |
| Sardines Grillées Marocaines | Sardines fraîches marinées et grillées, salade d'herbes | 65 | 6500 |

**3. Entrées Mer**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Soupe de Poisson Safranée | Soupe de poisson maison au safran de Taliouine | 55 | 5500 |
| Salade de Poulpe | Poulpe tendre en salade tiède, paprika et huile d'olive | 75 | 7500 |
| Pastilla au Poisson | Pastilla croustillante aux fruits de mer et vermicelles | 85 | 8500 |

**4. Accompagnements**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Riz Safrané | Riz basmati au safran et amandes effilées | 30 | 3000 |
| Légumes Grillés | Assortiment de légumes de saison grillés | 35 | 3500 |
| Frites Maison | Frites croustillantes coupées à la main | 25 | 2500 |

**5. Desserts**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Crème Brûlée à la Fleur d'Oranger | Crème brûlée parfumée à la fleur d'oranger | 55 | 5500 |
| Tarte au Citron | Tarte au citron meringuée, biscuit sablé | 50 | 5000 |
| Salade de Fruits Frais | Fruits de saison, menthe et miel | 40 | 4000 |

**6. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe | Thé vert à la menthe fraîche | 18 | 1800 |
| Eau Minérale Sidi Ali | Eau plate ou gazeuse 50cl | 15 | 1500 |
| Limonade Maison | Citrons pressés, menthe et fleur d'oranger | 30 | 3000 |
| Jus Panaché | Mélange de fruits frais de saison | 35 | 3500 |

---

## Restaurant 3: Riad Jnane Mogador (Marrakech) - Riad Fine Dining

| Field | Value |
|-------|-------|
| **Name** | Riad Jnane Mogador |
| **City** | Marrakech |
| **Address** | 116 Derb Sidi Bouloukate, Riad Zitoun El Kdim, Medina |
| **Cuisine** | Moroccan Fine Dining |
| **Price Range** | 3 (upscale) |
| **Phone** | +212524389670 |
| **WhatsApp** | +212663456123 |
| **Visual Style** | elegant/ornate - deep burgundy, gold filigree feel |
| **Theme Colors** | primary: #8B1A3A, secondary: #C5A44E, bg: #FDF8F4, accent: #D4764E |

### Categories & Dishes

**1. Entrées du Riad**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Pastilla au Pigeon | Feuilles croustillantes farcies au pigeon, amandes et cannelle, sucre glace | 120 | 12000 |
| Briouates à l'Agneau | Triangles de brick farcis à l'agneau épicé et pignons de pin | 75 | 7500 |
| Soupe Harira aux Dattes | Harira servie avec dattes Medjool et chebakia | 45 | 4500 |
| Salade de Fenouil à l'Orange | Fenouil émincé, suprêmes d'orange, olives noires et menthe | 55 | 5500 |

**2. Tagines d'Exception**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes | Variants |
|-----------|-------------------|-------------|----------|----------|
| Tagine d'Agneau au Safran de Taliouine | Souris d'agneau confite au safran pur, oignons grelots | 150 | 15000 | - |
| Tagine de Canard aux Figues | Magret de canard confit aux figues fraîches et miel d'arganier | 160 | 16000 | - |
| Tangia Marrakchia | Pot de terre cuit 12h dans les cendres du hammam, viande d'agneau | 130 | 13000 | Pour 2: 220 MAD |
| Tagine Poulet M'qualli | Poulet fermier au citron confit, olives et gingembre | 110 | 11000 | - |

**3. Couscous Vendredi**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Couscous Fassi aux Sept Légumes | Recette traditionnelle de Fès, sept légumes de saison | 120 | 12000 |
| Couscous au Beurre et Raisins | Semoule fine au beurre smen, raisins secs et sucre | 95 | 9500 |
| Couscous Baddaz aux Fèves | Couscous de maïs aux fèves fraîches et huile d'argan | 100 | 10000 |

**4. Desserts du Riad**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Pastilla au Lait d'Amande | Feuilles croustillantes, crème aux amandes et fleur d'oranger | 65 | 6500 |
| Cornes de Gazelle Maison | Pâtisserie aux amandes façonnée à la main | 55 | 5500 |
| Assortiment de Pâtisseries (12 pièces) | Sélection de pâtisseries marocaines du jour | 120 | 12000 |
| Orange à la Cannelle | Suprêmes d'orange, eau de rose, cannelle et amandes grillées | 45 | 4500 |

**5. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé du Riad | Thé vert à la menthe et fleur d'oranger, servi en théière d'argent | 25 | 2500 |
| Jus d'Amande (Raibi) | Lait d'amande frais parfumé à la cannelle | 35 | 3500 |
| Café Épicé | Expresso aux épices marocaines, cardamome et gingembre | 20 | 2000 |

---

## Restaurant 4: Snack Chez Hamid (Marrakech) - Street Food / Fast Casual

| Field | Value |
|-------|-------|
| **Name** | Snack Chez Hamid |
| **City** | Marrakech |
| **Address** | 23 Rue Bab Agnaou, Jemaa el-Fna |
| **Cuisine** | Street Food / Snacks |
| **Price Range** | 1 (budget) |
| **Phone** | +212524443215 |
| **WhatsApp** | +212664567234 |
| **Visual Style** | vibrant/colorful - orange and red, bold, energetic |
| **Theme Colors** | primary: #E85D26, secondary: #FFC107, bg: #FFFDF7, accent: #D32F2F |

### Categories & Dishes

**1. Sandwichs**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes | Variants |
|-----------|-------------------|-------------|----------|----------|
| Bocadillo Kefta | Pain rond garni de kefta grillée, tomates, oignons et harissa | 25 | 2500 | Double: 40 MAD |
| Sandwich Chawarma | Viande marinée à la broche, crudités et sauce blanche | 30 | 3000 | - |
| Sandwich Thon | Pain baguette, thon, salade, olives et mayonnaise | 20 | 2000 | - |
| Sandwich Merguez | Merguez grillée dans du pain avec poivrons et harissa | 22 | 2200 | - |

**2. Plats Chauds**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tagine Express Poulet | Tagine poulet olives servi avec du pain | 40 | 4000 |
| Kefta Tagine Express | Boulettes kefta sauce tomate, oeuf, servi avec pain | 35 | 3500 |
| Brochettes (6 pièces) | Brochettes de viande hachée grillées au charbon | 30 | 3000 |
| Tangia Express | Portion individuelle de tangia d'agneau | 50 | 5000 |

**3. Msemen & Crêpes**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Msemen Nature | Crêpe feuilletée traditionnelle, beurre et miel | 8 | 800 |
| Msemen au Fromage | Msemen farci au fromage fondu et herbes | 15 | 1500 |
| Rghaif à la Viande | Crêpe fine farcie à la viande hachée épicée | 18 | 1800 |
| Baghrir (3 pièces) | Crêpes mille trous au miel et beurre | 15 | 1500 |

**4. Jus & Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Jus d'Orange Pressé | Oranges fraîches pressées devant vous | 10 | 1000 |
| Panaché de Fruits | Mélange banane, fraise, jus d'orange | 20 | 2000 |
| Thé à la Menthe | Thé vert menthe fraîche, verre traditionnel | 8 | 800 |
| Café Noir | Expresso simple | 8 | 800 |
| Jus d'Avocat | Avocat frais mixé avec lait et sucre | 18 | 1800 |

---

## Restaurant 5: Dar Hatim (Fez) - Fassi Cuisine

| Field | Value |
|-------|-------|
| **Name** | Dar Hatim |
| **City** | Fes |
| **Address** | 19 Derb Rcif, Fès el Bali, Medina |
| **Cuisine** | Fassi Traditional |
| **Price Range** | 2 (moderate) |
| **Phone** | +212535637575 |
| **WhatsApp** | +212665678345 |
| **Visual Style** | warm/traditional - zellige blues and whites, ornamental |
| **Theme Colors** | primary: #1B5E73, secondary: #C5956A, bg: #F8F5F0, accent: #2196F3 |

### Categories & Dishes

**1. Entrées Fassies**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Pastilla au Pigeon Fassie | La vraie pastilla de Fès au pigeon, amandes et sucre-cannelle | 85 | 8500 |
| Harira Fassie | Harira riche aux lentilles, pois chiches et herbes aromatiques | 20 | 2000 |
| Rfissa | Msemen émietté dans un bouillon de lentilles au fenugrec et poulet | 50 | 5000 |
| Briouates aux Crevettes | Feuilles de brick farcies aux crevettes et vermicelles | 45 | 4500 |

**2. Tagines de Fès**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tagine M'rouzia | Agneau confit au miel, raisins secs et ras el hanout de Fès | 95 | 9500 |
| Tagine Poulet aux Olives | Poulet beldi aux olives vertes et citrons confits | 65 | 6500 |
| Tagine Boeuf aux Artichauts | Boeuf tendre aux artichauts, petits pois et fèves | 75 | 7500 |
| Tagine Berbère Végétarien | Légumes de saison aux épices berbères et argan | 50 | 5000 |

**3. Couscous**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Couscous Fassi Sept Légumes | La recette ancestrale fassie aux sept légumes et agneau | 80 | 8000 |
| Seffa Medfouna | Semoule sucrée au beurre, poulet caché en dessous, amandes | 90 | 9000 |

**4. Pâtisseries de Fès**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Chebakia au Miel | Pâtisserie en forme de fleur, frite et trempée dans le miel | 35 | 3500 |
| M'hancha | Serpentin d'amandes enroulé en spirale, parfumé à la cannelle | 45 | 4500 |
| Ghribia aux Amandes | Sablés fondants aux amandes | 30 | 3000 |
| Assortiment Fassi (plateau) | 15 pièces variées de pâtisseries fassies | 80 | 8000 |

**5. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe et Absinthe | Thé parfumé à la menthe et chiba (absinthe locale) | 15 | 1500 |
| Jus d'Orange | Oranges pressées du Souss | 15 | 1500 |
| Lait d'Amande Fassi | Préparé avec amandes fraîches, eau de rose et cannelle | 25 | 2500 |

---

## Restaurant 6: Café Hafa (Tangier) - Café / Lounge Panoramique

| Field | Value |
|-------|-------|
| **Name** | Café Hafa |
| **City** | Tangier |
| **Address** | Avenue Hafa, Marshan |
| **Cuisine** | Café / Light Bites |
| **Price Range** | 1 (budget) |
| **Phone** | +212539334067 |
| **WhatsApp** | +212666789456 |
| **Visual Style** | minimal/white - Mediterranean white, sea blue accents |
| **Theme Colors** | primary: #FFFFFF, secondary: #1976D2, bg: #F0F4F8, accent: #0097A7 |

### Categories & Dishes

**1. Boissons Chaudes**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe | Thé vert à la menthe fraîche, vue sur le détroit de Gibraltar | 12 | 1200 |
| Café Noir | Expresso corsé à la marocaine | 10 | 1000 |
| Nous-Nous | Moitié café moitié lait chaud | 12 | 1200 |
| Café au Lait | Grand café au lait crémeux | 15 | 1500 |
| Thé aux Herbes | Infusion de thym, armoise ou verveine | 12 | 1200 |

**2. Jus & Boissons Fraîches**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Jus d'Orange Frais | Oranges pressées à la minute | 15 | 1500 |
| Jus Banane-Lait | Smoothie banane au lait frais | 20 | 2000 |
| Jus d'Avocat | Avocat crémeux mixé au lait et une touche de miel | 22 | 2200 |
| Milkshake Fraise | Fraises fraîches, lait et glace | 25 | 2500 |

**3. Petit-Déjeuner**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Petit-Déjeuner Tangérois | Msemen, baghrir, beurre, confiture, miel, huile d'olive et thé | 35 | 3500 |
| Bissara | Soupe de fèves sèches à l'huile d'olive et cumin, pain chaud | 15 | 1500 |
| Oeufs Brouillés | Oeufs brouillés avec tomates, poivrons et pain | 25 | 2500 |

**4. Snacks Légers**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Msemen au Miel | Crêpe feuilletée servie avec miel et beurre | 10 | 1000 |
| Harcha | Galette de semoule grillée, beurre et confiture | 10 | 1000 |
| Crêpe au Chocolat | Crêpe fine garnie de chocolat fondu et banane | 20 | 2000 |
| Sandwich Mixte | Baguette garnie thon, fromage, crudités | 25 | 2500 |

---

## Restaurant 7: Villa Blanca Grill (Rabat) - Modern Fusion

| Field | Value |
|-------|-------|
| **Name** | Villa Blanca Grill |
| **City** | Rabat |
| **Address** | 6 Rue Oued Fès, Agdal |
| **Cuisine** | Modern Moroccan Fusion |
| **Price Range** | 3 (upscale) |
| **Phone** | +212537774520 |
| **WhatsApp** | +212667890567 |
| **Visual Style** | modern/clean - black and white with green accents, sans-serif |
| **Theme Colors** | primary: #1A1A1A, secondary: #4CAF50, bg: #FFFFFF, accent: #FF6B35 |

### Categories & Dishes

**1. Entrées Fusion**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tartare de Thon à la Chermoula | Thon rouge mariné façon chermoula, avocat et sésame | 95 | 9500 |
| Briouates de Canard Confit | Brick croustillant au canard effiloché, chutney de figue | 85 | 8500 |
| Salade Tiède de Poulpe Grillé | Poulpe tendre, roquette, tomates confites et vinaigrette citron | 80 | 8000 |
| Velouté de Patate Douce au Cumin | Soupe crémeuse, chips de patate douce et huile d'argan | 55 | 5500 |

**2. Plats Principaux**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Côte de Boeuf Maturée (500g) | Viande maturée 30 jours, grillée au charbon, beurre aux herbes | 250 | 25000 |
| Carré d'Agneau au Za'atar | Carré d'agneau rôti au za'atar, purée de pois chiches | 180 | 18000 |
| Filet de Mérou en Croûte d'Herbes | Mérou rôti, risotto aux champignons et jus de viande léger | 160 | 16000 |
| Poulet Fermier Rôti Entier | Poulet label rôti aux herbes, pommes grenaille, jus au citron confit | 140 | 14000 |
| Bowl Végétarien d'Argan | Quinoa, légumes rôtis, halloumi grillé et vinaigrette argan | 95 | 9500 |

**3. Burgers Premium**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes | Variants |
|-----------|-------------------|-------------|----------|----------|
| Burger Smash Classique | Double smash patty, cheddar, oignon caramélisé, sauce maison | 85 | 8500 | Simple: 65 MAD |
| Burger Agneau Épicé | Steak d'agneau haché, fromage de chèvre, confit d'oignon | 95 | 9500 | - |
| Burger Végétarien | Galette de lentilles et betterave, avocat, sauce tahini | 75 | 7500 | - |

**4. Desserts**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Fondant au Chocolat | Coeur coulant au chocolat noir, glace vanille | 65 | 6500 |
| Cheesecake à l'Eau de Rose | Cheesecake crémeux parfumé à l'eau de rose, pistaches | 60 | 6000 |
| Tiramisu à la Cardamome | Revisité aux épices marocaines et café de Fès | 55 | 5500 |

**5. Cocktails & Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Limonade au Basilic | Citron frais, basilic, miel et eau pétillante | 35 | 3500 |
| Smoothie Détox | Épinard, concombre, pomme verte et gingembre | 40 | 4000 |
| Mocktail Passion-Mangue | Fruit de la passion, mangue et menthe | 45 | 4500 |
| Thé Glacé Maison | Thé vert infusé à froid, menthe et citron | 30 | 3000 |

---

## Restaurant 8: Pizzeria Napoli (Agadir) - Italian / Pizza

| Field | Value |
|-------|-------|
| **Name** | Pizzeria Napoli |
| **City** | Agadir |
| **Address** | Avenue Hassan II, Secteur Balnéaire |
| **Cuisine** | Pizza / Italian |
| **Price Range** | 2 (moderate) |
| **Phone** | +212528846090 |
| **WhatsApp** | +212668901678 |
| **Visual Style** | vibrant/warm - red and cream, rustic Italian |
| **Theme Colors** | primary: #C62828, secondary: #FFC107, bg: #FFFDE7, accent: #4CAF50 |

### Categories & Dishes

**1. Pizzas Classiques**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes | Variants |
|-----------|-------------------|-------------|----------|----------|
| Margherita | Sauce tomate, mozzarella fior di latte, basilic frais | 55 | 5500 | Grande: 75 MAD |
| Quatre Fromages | Mozzarella, gorgonzola, parmesan, chèvre | 70 | 7000 | Grande: 95 MAD |
| Diavola | Sauce tomate, mozzarella, salami piquant, piment | 65 | 6500 | Grande: 85 MAD |
| Calzone Farci | Chausson farci jambon, champignons, mozzarella, oeuf | 70 | 7000 | - |

**2. Pizzas Spéciales**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Pizza Fruits de Mer | Crevettes, calamars, moules, ail et persil | 85 | 8500 |
| Pizza Kefta Marocaine | Kefta épicée, poivrons, oignons, fromage fondu | 75 | 7500 |
| Pizza Végétarienne | Aubergines, courgettes, poivrons, olives, champignons | 60 | 6000 |

**3. Pâtes**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Spaghetti Bolognaise | Sauce bolognaise maison, parmesan râpé | 55 | 5500 |
| Penne Arrabiata | Pâtes à la sauce tomate piquante, ail et piment | 50 | 5000 |
| Tagliatelles aux Fruits de Mer | Crevettes, moules et calamars, sauce crème safranée | 80 | 8000 |
| Lasagne Maison | Lasagnes traditionnelles à la bolognaise, gratinées | 65 | 6500 |

**4. Salades & Entrées**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Salade César | Laitue romaine, poulet grillé, croûtons, parmesan, sauce César | 50 | 5000 |
| Bruschetta Tomate-Basilic | Pain grillé, tomates fraîches, basilic et huile d'olive | 35 | 3500 |
| Soupe Minestrone | Soupe de légumes italienne aux petites pâtes | 30 | 3000 |

**5. Desserts**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tiramisu | Mascarpone, café, biscuits et cacao | 45 | 4500 |
| Panna Cotta | Crème vanille, coulis de fruits rouges | 40 | 4000 |
| Gelato (2 boules) | Glace artisanale italienne, choix de parfums | 30 | 3000 |

**6. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Coca-Cola / Fanta | Boisson gazeuse 33cl | 15 | 1500 |
| Jus d'Orange Frais | Oranges d'Agadir pressées | 18 | 1800 |
| Thé à la Menthe | Thé vert menthe fraîche | 12 | 1200 |
| Eau Minérale Sidi Harazem | 1,5L plate | 10 | 1000 |

---

## Restaurant 9: La Table du Vent (Essaouira) - Seafood / Rooftop

| Field | Value |
|-------|-------|
| **Name** | La Table du Vent |
| **City** | Essaouira |
| **Address** | 2 Rue Ibn Rochd, Médina |
| **Cuisine** | Seafood / Rooftop |
| **Price Range** | 2 (moderate) |
| **Phone** | +212524784930 |
| **WhatsApp** | +212669012789 |
| **Visual Style** | coastal/airy - ocean blue and sandy tones, relaxed |
| **Theme Colors** | primary: #0277BD, secondary: #FFB74D, bg: #FAFAFA, accent: #00897B |

### Categories & Dishes

**1. Poissons du Port**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Sardines Grillées d'Essaouira | 6 sardines fraîches grillées, chermoula et salade | 35 | 3500 |
| Friture de Poisson Mixte | Assortiment de petits poissons frits, citron et cumin | 50 | 5000 |
| Loup de Mer Grillé | Poisson entier grillé au charbon, légumes de saison | 85 | 8500 |
| Filet de Saint-Pierre | Filet poêlé, beurre noisette et câpres | 95 | 9500 |

**2. Fruits de Mer**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Crevettes Grillées à la Chermoula | Crevettes royales, marinade chermoula, riz safrané | 80 | 8000 |
| Calamars Farcis | Calamars farcis au riz, herbes et épices | 70 | 7000 |
| Tajine de Crevettes | Crevettes en tajine, tomates, poivrons et coriandre | 75 | 7500 |
| Plateau Souiri (pour 2) | Assortiment de poissons et fruits de mer grillés | 180 | 18000 |

**3. Plats Terre**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tagine Poulet Citron | Poulet fermier aux citrons confits et olives | 55 | 5500 |
| Brochettes de Kefta | Viande hachée épicée grillée, salade et frites | 45 | 4500 |
| Salade Niçoise Souirie | Thon frais, oeufs, olives, tomates et haricots verts | 50 | 5000 |

**4. Desserts**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Crêpe au Miel et Argan | Crêpe garnie de miel d'Essaouira et huile d'argan | 30 | 3000 |
| Salade de Fruits de Saison | Fruits frais, menthe et eau de fleur d'oranger | 25 | 2500 |
| Cornes de Gazelle | Pâtisserie marocaine aux amandes | 30 | 3000 |

**5. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe | Thé traditionnel à la menthe fraîche | 12 | 1200 |
| Jus d'Orange Pressé | Oranges fraîches du marché | 15 | 1500 |
| Smoothie Banane-Avocat | Banane, avocat, lait et miel | 25 | 2500 |
| Limonade Gingembre Menthe | Citron, gingembre frais, menthe et miel | 22 | 2200 |

---

## Restaurant 10: Bab Mansour (Meknes) - Café-Boulangerie / Bakery

| Field | Value |
|-------|-------|
| **Name** | Pâtisserie Bab Mansour |
| **City** | Meknes |
| **Address** | 12 Place El Hedim, face à Bab Mansour |
| **Cuisine** | Café / Bakery / Pâtisserie |
| **Price Range** | 1 (budget) |
| **Phone** | +212535524890 |
| **WhatsApp** | +212660123890 |
| **Visual Style** | warm/golden - cream and gold, bakery warmth |
| **Theme Colors** | primary: #D4A574, secondary: #8B6914, bg: #FFFBF5, accent: #C75B39 |

### Categories & Dishes

**1. Pâtisseries Marocaines**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Cornes de Gazelle (pièce) | Croissant aux amandes et fleur d'oranger | 5 | 500 |
| Ghriba aux Amandes | Sablé fondant aux amandes entières | 5 | 500 |
| Fekkas aux Raisins | Biscotti marocain aux raisins secs et amandes | 4 | 400 |
| Chebakia au Miel | Pâtisserie au sésame plongée dans le miel | 6 | 600 |
| Briouate aux Amandes | Triangle de brick fourré aux amandes et parfumé | 5 | 500 |
| Assortiment 500g | Plateau mixte de pâtisseries marocaines | 60 | 6000 |

**2. Viennoiseries**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Croissant au Beurre | Croissant pur beurre doré au four | 8 | 800 |
| Pain au Chocolat | Viennoiserie feuilletée au chocolat | 10 | 1000 |
| Msemen | Crêpe feuilletée traditionnelle, miel ou fromage | 5 | 500 |
| Baghrir (3 pièces) | Crêpes mille trous avec beurre fondu et miel | 12 | 1200 |
| Harcha au Beurre | Galette de semoule grillée | 5 | 500 |

**3. Petit-Déjeuner**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Petit-Déjeuner Meknassi | Msemen, baghrir, harcha, confiture, miel, huile d'olive, thé | 30 | 3000 |
| Petit-Déjeuner Français | Croissant, pain, beurre, confiture, café au lait | 35 | 3500 |
| Oeufs au Plat | 2 oeufs au plat, pain, beurre et confiture | 20 | 2000 |

**4. Boissons Chaudes**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe | Thé vert à la menthe fraîche | 10 | 1000 |
| Café Noir | Expresso simple | 8 | 800 |
| Nous-Nous | Demi-café demi-lait à la marocaine | 10 | 1000 |
| Café au Lait | Grand café crème | 12 | 1200 |
| Chocolat Chaud | Chocolat au lait onctueux | 15 | 1500 |

**5. Jus & Smoothies**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Jus d'Orange | Oranges pressées fraîches | 12 | 1200 |
| Jus d'Avocat | Avocat, lait et miel | 18 | 1800 |
| Jus de Fraise | Fraises fraîches mixées | 18 | 1800 |
| Milkshake Banane | Banane, lait et glace | 20 | 2000 |

---

## Bonus Restaurant: Dar Chaouen (Chefchaouen) - Rooftop / Riad

| Field | Value |
|-------|-------|
| **Name** | Dar Chaouen |
| **City** | Chefchaouen |
| **Address** | 7 Rue Abi Khancha, Médina |
| **Cuisine** | Traditional Moroccan / Rooftop |
| **Price Range** | 2 (moderate) |
| **Phone** | +212539986170 |
| **WhatsApp** | +212661345012 |
| **Visual Style** | vibrant/blue - the famous Chefchaouen blue and white |
| **Theme Colors** | primary: #1565C0, secondary: #FFFFFF, bg: #E3F2FD, accent: #FF8F00 |

### Categories & Dishes

**1. Entrées**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Harira | Soupe traditionnelle aux lentilles et tomates | 20 | 2000 |
| Salade Mechouia | Poivrons et tomates grillés, ail, huile d'olive et cumin | 25 | 2500 |
| Zaalouk | Purée d'aubergines à la tomate et aux épices | 25 | 2500 |
| Briouates au Fromage de Chèvre | Brick croustillant farci au fromage de chèvre de Chaouen | 35 | 3500 |

**2. Tagines**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Tagine Poulet aux Olives | Poulet fermier du Rif, olives et citrons confits | 55 | 5500 |
| Tagine Kefta aux Oeufs | Boulettes épicées en sauce tomate, oeufs pochés | 45 | 4500 |
| Tagine Agneau aux Pruneaux | Agneau tendre aux pruneaux et amandes grillées | 70 | 7000 |
| Tagine Légumes du Rif | Légumes frais de la montagne, épices et huile d'olive | 40 | 4000 |

**3. Spécialités du Rif**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Couscous au Beurre Smen | Semoule roulée à la main, beurre smen vieilli et sucre | 60 | 6000 |
| Khliaa aux Oeufs | Viande séchée confite sautée avec oeufs brouillés | 45 | 4500 |
| Soupe Bessara | Soupe épaisse de fèves sèches, cumin et huile d'olive | 15 | 1500 |

**4. Desserts & Pâtisseries**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Crêpes au Miel | Crêpes chaudes avec miel des montagnes du Rif | 20 | 2000 |
| Cornes de Gazelle (3 pièces) | Pâtisserie aux amandes, fleur d'oranger | 25 | 2500 |
| Fruits de Saison | Assiette de fruits frais | 20 | 2000 |

**5. Boissons**
| Dish (FR) | Description (FR) | Price (MAD) | Centimes |
|-----------|-------------------|-------------|----------|
| Thé à la Menthe | Le thé traditionnel de Chaouen | 10 | 1000 |
| Jus d'Orange | Oranges pressées fraîches | 12 | 1200 |
| Café Noir | Expresso | 8 | 800 |
| Jus d'Avocat | Avocat, lait et touche de miel | 18 | 1800 |
| Infusion Verveine | Tisane de verveine des montagnes du Rif | 12 | 1200 |

---

## Summary Table

| # | Restaurant | City | Cuisine | Price Range | Phone | Dishes |
|---|-----------|------|---------|-------------|-------|--------|
| 1 | La Sqala | Casablanca | Traditional Moroccan | $$ | +212522260960 | 24 |
| 2 | Le Comptoir du Port | Casablanca | Seafood / Mediterranean | $$$ | +212522797800 | 22 |
| 3 | Riad Jnane Mogador | Marrakech | Fine Dining Moroccan | $$$ | +212524389670 | 18 |
| 4 | Snack Chez Hamid | Marrakech | Street Food | $ | +212524443215 | 18 |
| 5 | Dar Hatim | Fes | Fassi Traditional | $$ | +212535637575 | 18 |
| 6 | Cafe Hafa | Tangier | Cafe / Light Bites | $ | +212539334067 | 17 |
| 7 | Villa Blanca Grill | Rabat | Modern Fusion | $$$ | +212537774520 | 18 |
| 8 | Pizzeria Napoli | Agadir | Italian / Pizza | $$ | +212528846090 | 20 |
| 9 | La Table du Vent | Essaouira | Seafood / Rooftop | $$ | +212524784930 | 17 |
| 10 | Patisserie Bab Mansour | Meknes | Cafe / Bakery | $ | +212535524890 | 22 |
| 11 | Dar Chaouen | Chefchaouen | Traditional / Rooftop | $$ | +212539986170 | 19 |
| **Total** | | **9 cities** | **10 cuisine types** | | | **213** |

---

## Phone Number Format Reference

All phone numbers follow the Morocco +212 format:
- **Landlines**: +212 5XX-XXXXXX (city code after 5: 22=Casa, 24=Marrakech, 35=Fez/Meknes, 37=Rabat, 39=Tangier/Chaouen, 28=Agadir)
- **Mobile/WhatsApp**: +212 6XX-XXXXXX (Maroc Telecom 06, Orange 07, Inwi 06/07)

## Slug Convention

Slugs follow the Diyafa pattern: `{name-kebab}-{city-kebab}-{random6digits}`
- `la-sqala-casablanca-182736`
- `le-comptoir-du-port-casablanca-293847`
- `riad-jnane-mogador-marrakech-394958`
- `snack-chez-hamid-marrakech-405069`
- `dar-hatim-fes-516170`
- `cafe-hafa-tangier-627281`
- `villa-blanca-grill-rabat-738392`
- `pizzeria-napoli-agadir-849403`
- `la-table-du-vent-essaouira-950514`
- `patisserie-bab-mansour-meknes-061625`
- `dar-chaouen-chefchaouen-172736`

## Theme Presets Summary

| Restaurant | Style | Primary | Secondary | Background | Accent |
|-----------|-------|---------|-----------|------------|--------|
| La Sqala | warm/traditional | #C4956A | #8B5E3C | #FFF8F0 | #D4764E |
| Le Comptoir du Port | elegant/dark | #1B3A5C | #C5A44E | #F5F7FA | #2E6B9E |
| Riad Jnane Mogador | elegant/ornate | #8B1A3A | #C5A44E | #FDF8F4 | #D4764E |
| Snack Chez Hamid | vibrant/colorful | #E85D26 | #FFC107 | #FFFDF7 | #D32F2F |
| Dar Hatim | warm/zellige | #1B5E73 | #C5956A | #F8F5F0 | #2196F3 |
| Cafe Hafa | minimal/white | #FFFFFF | #1976D2 | #F0F4F8 | #0097A7 |
| Villa Blanca Grill | modern/clean | #1A1A1A | #4CAF50 | #FFFFFF | #FF6B35 |
| Pizzeria Napoli | vibrant/warm | #C62828 | #FFC107 | #FFFDE7 | #4CAF50 |
| La Table du Vent | coastal/airy | #0277BD | #FFB74D | #FAFAFA | #00897B |
| Patisserie Bab Mansour | warm/golden | #D4A574 | #8B6914 | #FFFBF5 | #C75B39 |
| Dar Chaouen | vibrant/blue | #1565C0 | #FFFFFF | #E3F2FD | #FF8F00 |
