const zodMessages = {
  errors: {
    invalid_type: "Type attendu : {{expected}}, re\u00e7u : {{received}}",
    invalid_type_received_undefined: "Obligatoire",
    invalid_literal:
      "Valeur litt\u00e9rale invalide, attendu : {{expected}}",
    unrecognized_keys: "Cl\u00e9(s) non reconnue(s) dans l'objet : {{- keys}}",
    invalid_union: "Entr\u00e9e invalide",
    invalid_union_discriminator:
      "Valeur de discriminant invalide. Attendu : {{- options}}",
    invalid_enum_value:
      "Valeur d'\u00e9num\u00e9ration invalide. Attendu : {{- options}}, re\u00e7u : '{{received}}'",
    invalid_arguments: "Arguments de fonction invalides",
    invalid_return_type: "Type de retour de fonction invalide",
    invalid_date: "Date invalide",
    custom: "Entr\u00e9e invalide",
    invalid_intersection_types:
      "Les r\u00e9sultats de l'intersection n'ont pas pu \u00eatre fusionn\u00e9s",
    not_multiple_of: "Le nombre doit \u00eatre un multiple de {{multipleOf}}",
    not_finite: "Le nombre doit \u00eatre fini",
    invalid_string: {
      email: "Adresse email invalide",
      url: "URL invalide",
      uuid: "UUID invalide",
      cuid: "CUID invalide",
      regex: "Valeur invalide",
      datetime: "Date et heure invalides",
      startsWith:
        'Entr\u00e9e invalide : doit commencer par "{{startsWith}}"',
      endsWith: 'Entr\u00e9e invalide : doit se terminer par "{{endsWith}}"',
    },
    too_small: {
      array: {
        exact:
          "Le tableau doit contenir exactement {{minimum}} \u00e9l\u00e9ment(s)",
        inclusive:
          "Le tableau doit contenir au moins {{minimum}} \u00e9l\u00e9ment(s)",
        not_inclusive:
          "Le tableau doit contenir plus de {{minimum}} \u00e9l\u00e9ment(s)",
      },
      string: {
        exact:
          "La cha\u00eene doit contenir exactement {{minimum}} caract\u00e8re(s)",
        inclusive:
          "La cha\u00eene doit contenir au moins {{minimum}} caract\u00e8re(s)",
        not_inclusive:
          "La cha\u00eene doit contenir plus de {{minimum}} caract\u00e8re(s)",
      },
      number: {
        exact: "Le nombre doit \u00eatre exactement {{minimum}}",
        inclusive:
          "Le nombre doit \u00eatre sup\u00e9rieur ou \u00e9gal \u00e0 {{minimum}}",
        not_inclusive:
          "Le nombre doit \u00eatre sup\u00e9rieur \u00e0 {{minimum}}",
      },
      set: {
        exact: "Entr\u00e9e invalide",
        inclusive: "Entr\u00e9e invalide",
        not_inclusive: "Entr\u00e9e invalide",
      },
      date: {
        exact:
          "La date doit \u00eatre exactement le {{- minimum, datetime}}",
        inclusive:
          "La date doit \u00eatre sup\u00e9rieure ou \u00e9gale au {{- minimum, datetime}}",
        not_inclusive:
          "La date doit \u00eatre post\u00e9rieure au {{- minimum, datetime}}",
      },
    },
    too_big: {
      array: {
        exact:
          "Le tableau doit contenir exactement {{maximum}} \u00e9l\u00e9ment(s)",
        inclusive:
          "Le tableau doit contenir au plus {{maximum}} \u00e9l\u00e9ment(s)",
        not_inclusive:
          "Le tableau doit contenir moins de {{maximum}} \u00e9l\u00e9ment(s)",
      },
      string: {
        exact:
          "La cha\u00eene doit contenir exactement {{maximum}} caract\u00e8re(s)",
        inclusive:
          "La cha\u00eene doit contenir au plus {{maximum}} caract\u00e8re(s)",
        not_inclusive:
          "La cha\u00eene doit contenir moins de {{maximum}} caract\u00e8re(s)",
      },
      number: {
        exact: "Le nombre doit \u00eatre exactement {{maximum}}",
        inclusive:
          "Le nombre doit \u00eatre inf\u00e9rieur ou \u00e9gal \u00e0 {{maximum}}",
        not_inclusive:
          "Le nombre doit \u00eatre inf\u00e9rieur \u00e0 {{maximum}}",
      },
      set: {
        exact: "Entr\u00e9e invalide",
        inclusive: "Entr\u00e9e invalide",
        not_inclusive: "Entr\u00e9e invalide",
      },
      date: {
        exact:
          "La date doit \u00eatre exactement le {{- maximum, datetime}}",
        inclusive:
          "La date doit \u00eatre ant\u00e9rieure ou \u00e9gale au {{- maximum, datetime}}",
        not_inclusive:
          "La date doit \u00eatre ant\u00e9rieure au {{- maximum, datetime}}",
      },
    },
  },
  validations: {
    email: "adresse email",
    url: "URL",
    uuid: "UUID",
    cuid: "CUID",
    regex: "expression r\u00e9guli\u00e8re",
    datetime: "date et heure",
  },
  types: {
    function: "fonction",
    number: "nombre",
    string: "cha\u00eene de caract\u00e8res",
    nan: "NaN",
    integer: "nombre entier",
    float: "nombre d\u00e9cimal",
    boolean: "bool\u00e9en",
    date: "date",
    bigint: "BigInt",
    undefined: "undefined",
    symbol: "symbole",
    null: "null",
    array: "tableau",
    object: "objet",
    unknown: "inconnu",
    promise: "promise",
    void: "void",
    never: "never",
    map: "map",
    set: "set",
  },
};

export default zodMessages;
