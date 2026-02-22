
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at") VALUES
	('00000000-0000-0000-0000-000000000000', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'authenticated', 'authenticated', 'random@gmail.com', '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S', '2023-10-22 21:37:14.25057+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-11-06 23:04:07.101986+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-10-22 21:37:14.240954+00', '2023-11-06 23:04:07.106022+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);

-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("id", "user_id", "provider_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at") VALUES
	('7042152a-7151-49f1-9bfd-3d8f156e7aef', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '{"sub": "7042152a-7151-49f1-9bfd-3d8f156e7aef", "email": "random@gmail.com"}', 'email', '2023-10-22 21:37:14.249029+00', '2023-10-22 21:37:14.24905+00', '2023-10-22 21:37:14.24905+00');


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."menus" ("id", "name", "user_id", "slug", "background_image_url", "city", "address", "is_published", "updated_at", "created_at", "contact_number", "currency") VALUES
	('dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'Riad Marrakech', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'riad-marrakech-casablanca-482910', NULL, 'Casablanca', 'Boulevard Mohammed V', true, '2023-10-22 21:37:45.205+00', '2023-10-22 21:37:45.205+00', '+212522123456', 'MAD');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "menu_id", "created_at") VALUES
	('8a004237-33ac-45a2-854e-00ee3d0d3b03', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '2023-10-25 10:48:09.381+00'),
	('d4140553-1136-4a0a-bcb7-936843a4b3eb', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '2023-10-25 17:56:02.313+00'),
	('ee14c0d7-e831-4124-9d82-b0b3a843e596', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '2023-10-26 16:44:00.595+00'),
	('4bade4af-2b56-43b4-be54-0fa8eefb3990', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '2023-10-26 17:06:13.724+00'),
	('14a26a98-8e3b-4e17-9c73-ecebad43d2d5', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '2023-10-26 17:07:39.203+00');


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."languages" ("id", "name", "iso_code", "flag_url") VALUES
	('56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'English', 'GB', 'https://flagsapi.com/GB/flat/64.png'),
	('1fc3ba53-8dcb-4f1e-807b-f8655384f944', 'Afar', 'DJ', 'https://flagsapi.com/DJ/flat/64.png'),
	('0754133c-0c7d-4c66-a26e-5c07922d12ad', 'Abkhazian', 'GE', 'https://flagsapi.com/GE/flat/64.png'),
	('6a373f45-a818-402b-b990-958fa74d666c', 'Afrikaans', 'ZA', 'https://flagsapi.com/ZA/flat/64.png'),
	('b5e11ba1-c2f9-4275-8353-27b32a0efc50', 'Amharic', 'ET', 'https://flagsapi.com/ET/flat/64.png'),
	('70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a', 'Arabic', 'MA', 'https://flagsapi.com/MA/flat/64.png'),
	('f1ab07aa-38c6-47a5-aaed-63ad02e82afd', 'Assamese', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('c635e92d-37c1-436b-859c-142302459723', 'Aymara', 'BO', 'https://flagsapi.com/BO/flat/64.png'),
	('14f1ba6a-c319-4144-a262-bf2010e92b61', 'Azerbaijani', 'AZ', 'https://flagsapi.com/AZ/flat/64.png'),
	('674dcc79-109a-442a-a62e-b2dfcf9cd0c4', 'Bashkir', 'RU', 'https://flagsapi.com/RU/flat/64.png'),
	('729f7b4d-c06a-4152-86be-cfd6cba6d282', 'Belarusian', 'BY', 'https://flagsapi.com/BY/flat/64.png'),
	('7a32c160-37a5-4e8c-90e6-1d734925e8f5', 'Bulgarian', 'BG', 'https://flagsapi.com/BG/flat/64.png'),
	('e381d2ef-ed64-4bc4-aa1d-e64231e49161', 'Bihari', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('a5918e08-05b8-4e5f-a0b8-8d70d821aad6', 'Bislama', 'VU', 'https://flagsapi.com/VU/flat/64.png'),
	('d175a717-bb62-4973-ae2b-cf84ba37b2ce', 'Bengali/Bangla', 'BD', 'https://flagsapi.com/BD/flat/64.png'),
	('92a332c6-8b2e-4fa5-ae85-30786e69f616', 'Tibetan', 'CN', 'https://flagsapi.com/CN/flat/64.png'),
	('5f672e94-92bc-406a-b446-effbdcfb40fb', 'Breton', 'FR', 'https://flagsapi.com/FR/flat/64.png'),
	('199cb522-9906-44da-b3b4-9fed783428e7', 'Catalan', 'ES', 'https://flagsapi.com/ES/flat/64.png'),
	('6c6da6ff-b118-4c7b-ac93-4cf092dd1106', 'Corsican', 'FR', 'https://flagsapi.com/FR/flat/64.png'),
	('2bc0154f-4721-4d23-ae85-74a565e77977', 'Czech', 'CZ', 'https://flagsapi.com/CZ/flat/64.png'),
	('6dc59a67-98b1-4f62-a7d0-f8dd7997e02f', 'Welsh', 'GB', 'https://flagsapi.com/GB/flat/64.png'),
	('89cc793f-f048-4992-82dc-ef4347612e7d', 'Danish', 'DK', 'https://flagsapi.com/DK/flat/64.png'),
	('868e5bfd-cde2-4ba8-b79d-0c2773bc410b', 'German', 'DE', 'https://flagsapi.com/DE/flat/64.png'),
	('b23bc51d-78b6-452a-afd2-108f11a1456c', 'Bhutani', 'BT', 'https://flagsapi.com/BT/flat/64.png'),
	('23058c7e-0447-45dd-b7cf-9c9518e2af24', 'Greek', 'GR', 'https://flagsapi.com/GR/flat/64.png'),
	('88cc8bae-c8aa-4a4f-a603-9eeb0226e1a1', 'Esperanto', 'EH', 'https://flagsapi.com/EH/flat/64.png'),
	('8bc9685e-fffa-4607-a844-0e8f879f30c8', 'Spanish', 'ES', 'https://flagsapi.com/ES/flat/64.png'),
	('853785b1-d5ab-4e53-8296-3d85c8e8a272', 'Estonian', 'EE', 'https://flagsapi.com/EE/flat/64.png'),
	('998d2d37-f0ac-4d7a-bbcb-1bed2961691d', 'Basque', 'ES', 'https://flagsapi.com/ES/flat/64.png'),
	('d2eab232-1452-4770-a52d-d97cbce3c288', 'Persian', 'IR', 'https://flagsapi.com/IR/flat/64.png'),
	('5de1a4b1-0686-4764-b660-a72b9ac4fcc7', 'Finnish', 'FI', 'https://flagsapi.com/FI/flat/64.png'),
	('185d564b-b173-4a6c-97e9-1562220b7e45', 'Fiji', 'FJ', 'https://flagsapi.com/FJ/flat/64.png'),
	('31528d48-e412-4051-98cf-0e7f741f691a', 'Faeroese', 'FO', 'https://flagsapi.com/FO/flat/64.png'),
	('ced37313-fc91-4c4d-a480-5d8081311a8e', 'French', 'FR', 'https://flagsapi.com/FR/flat/64.png'),
	('8bdd9651-2a75-4033-a496-e9f1d2511135', 'Frisian', 'NL', 'https://flagsapi.com/NL/flat/64.png'),
	('3d43c1e6-abcc-49b4-9c80-24bb924f7f76', 'Irish', 'IE', 'https://flagsapi.com/IE/flat/64.png'),
	('33adc815-9636-46aa-bdb5-4cb06594cfaf', 'Scots/Gaelic', 'GB', 'https://flagsapi.com/GB/flat/64.png'),
	('51aa8bb1-057a-494a-a587-bc56d3f60e3e', 'Galician', 'ES', 'https://flagsapi.com/ES/flat/64.png'),
	('8a332e8a-7fd5-47b9-a4ca-740cfc89d0fa', 'Guarani', 'PY', 'https://flagsapi.com/PY/flat/64.png'),
	('5080d91a-d0df-458d-b0a7-18cb43aebfd7', 'Gujarati', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('8d2b6e75-6aa0-46c6-842a-322f901372e2', 'Hausa', 'NG', 'https://flagsapi.com/NG/flat/64.png'),
	('c7d97bc2-d129-4c80-b63e-d779d8437829', 'Hindi', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('451547b0-e24e-458d-9443-fead0f058d8b', 'Croatian', 'HR', 'https://flagsapi.com/HR/flat/64.png'),
	('df2a068b-0e5f-4d9a-8515-34fd0b448203', 'Hungarian', 'HU', 'https://flagsapi.com/HU/flat/64.png'),
	('16cf16e4-a55f-4d01-a68d-3462e7d357d5', 'Armenian', 'AM', 'https://flagsapi.com/AM/flat/64.png'),
	('ff9e52dc-2afb-4512-9566-e4d54a56c712', 'Interlingua', 'EU', 'https://flagsapi.com/EU/flat/64.png'),
	('f0862ed9-1e56-4f06-8708-134fc3215c0a', 'Interlingue', 'EU', 'https://flagsapi.com/EU/flat/64.png'),
	('b3d7a1c6-bd47-4cd1-b706-4485841cc49d', 'Inupiak', 'US', 'https://flagsapi.com/US/flat/64.png'),
	('b729632e-dd23-4396-9f1f-5516fb34a9c4', 'Indonesian', 'ID', 'https://flagsapi.com/ID/flat/64.png'),
	('87c51f03-5a90-443a-a21f-6db728d97766', 'Icelandic', 'IS', 'https://flagsapi.com/IS/flat/64.png'),
	('e39231e9-25be-4ec6-9678-9030ee1860f6', 'Italian', 'IT', 'https://flagsapi.com/IT/flat/64.png'),
	('70330e9b-2e39-4381-a9ab-33c7156450b3', 'Hebrew', 'IL', 'https://flagsapi.com/IL/flat/64.png'),
	('36e08a21-7257-4576-8741-e52639eb83ea', 'Japanese', 'JP', 'https://flagsapi.com/JP/flat/64.png'),
	('27532326-22fc-4c1a-a915-47c653b34492', 'Yiddish', 'IL', 'https://flagsapi.com/IL/flat/64.png'),
	('bc9f22c0-2dca-471c-88b1-3a964198c55b', 'Javanese', 'ID', 'https://flagsapi.com/ID/flat/64.png'),
	('28a7f516-6d19-418e-9aa2-b70f15a987e6', 'Georgian', 'GE', 'https://flagsapi.com/GE/flat/64.png'),
	('056aa38c-2b0b-44d1-8f82-c709dc8d503a', 'Kazakh', 'KZ', 'https://flagsapi.com/KZ/flat/64.png'),
	('7a8edc04-8e79-4bb6-8504-e16ae0ef5f69', 'Greenlandic', 'GL', 'https://flagsapi.com/GL/flat/64.png'),
	('e8f91d03-fce3-4b44-8594-c77a224ae8bb', 'Cambodian', 'KH', 'https://flagsapi.com/KH/flat/64.png'),
	('aca8a0d9-fc75-4f44-973b-2e15988b7134', 'Kannada', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('00a7484f-bfe6-4170-8716-6e6130fa8ead', 'Korean', 'KR', 'https://flagsapi.com/KR/flat/64.png'),
	('75de096a-c480-4017-8ac1-c37b885143e7', 'Kashmiri', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('142aee12-9269-4b85-9fdb-1a236cba7bf5', 'Kurdish', 'TR', 'https://flagsapi.com/TR/flat/64.png'),
	('d8769566-5fec-4bfb-b6fa-09cf17acec7f', 'Kirghiz', 'KG', 'https://flagsapi.com/KG/flat/64.png'),
	('f9c6aa78-b9e4-4567-8eac-81a248a742ec', 'Latin', 'VA', 'https://flagsapi.com/VA/flat/64.png'),
	('a69a72fc-85f8-4837-b648-884153e8eb2d', 'Lingala', 'CD', 'https://flagsapi.com/CD/flat/64.png'),
	('af825945-ddff-4fa9-99d5-f8240efe2d85', 'Laothian', 'LA', 'https://flagsapi.com/LA/flat/64.png'),
	('faa3a172-b35e-4cc0-bc4e-c72732c9354e', 'Lithuanian', 'LT', 'https://flagsapi.com/LT/flat/64.png'),
	('e9726a19-4937-471f-a5f5-65568bfe3713', 'Latvian/Lettish', 'LV', 'https://flagsapi.com/LV/flat/64.png'),
	('dfd9702e-2435-400d-9e88-55733189003a', 'Malagasy', 'MG', 'https://flagsapi.com/MG/flat/64.png'),
	('0e472846-b47d-4b08-b367-ebd9858742c8', 'Maori', 'NZ', 'https://flagsapi.com/NZ/flat/64.png'),
	('12259902-c14b-4f40-abe1-84c0a0fafd45', 'Macedonian', 'MK', 'https://flagsapi.com/MK/flat/64.png'),
	('6c0d8578-cdbe-4045-95ae-236e16a4a282', 'Malayalam', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('837a72c6-7af0-41d4-8e70-72eed1e6d21e', 'Mongolian', 'MN', 'https://flagsapi.com/MN/flat/64.png'),
	('743f85f8-818b-4448-a627-8f8a3bd4e0f3', 'Moldavian', 'MD', 'https://flagsapi.com/MD/flat/64.png'),
	('ae665924-5e6d-4eb0-8ee0-a7bfe61187af', 'Marathi', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('5cc36831-33f0-418d-a358-d7e047407277', 'Malay', 'MY', 'https://flagsapi.com/MY/flat/64.png'),
	('6f5a7abd-268b-4115-9808-6db55813edf8', 'Maltese', 'MT', 'https://flagsapi.com/MT/flat/64.png'),
	('520040b6-9fd2-4128-8805-f54d70513bff', 'Burmese', 'MM', 'https://flagsapi.com/MM/flat/64.png'),
	('e51d302b-a319-4f1d-bf56-be4f56d76c45', 'Nauru', 'NR', 'https://flagsapi.com/NR/flat/64.png'),
	('15f833dd-a6ca-4ca8-ac90-1b95591e3abd', 'Nepali', 'NP', 'https://flagsapi.com/NP/flat/64.png'),
	('750af890-cad5-43d4-a01f-711213dafccc', 'Dutch', 'NL', 'https://flagsapi.com/NL/flat/64.png'),
	('3a842f57-39ec-4388-8495-0557d3981bd5', 'Norwegian', 'NO', 'https://flagsapi.com/NO/flat/64.png'),
	('acec49bd-f7f8-4302-934b-592961af4f5f', 'Occitan', 'FR', 'https://flagsapi.com/FR/flat/64.png'),
	('1e6f1dc8-e7ef-4c98-9588-750bbaddcf32', 'Punjabi', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('c513f49c-7153-43dd-b824-d059c858a0e5', 'Polish', 'PL', 'https://flagsapi.com/PL/flat/64.png'),
	('e3505828-301e-4f42-b79f-11613f4b367e', 'Pashto/Pushto', 'AF', 'https://flagsapi.com/AF/flat/64.png'),
	('cef07284-0743-4310-bd4f-e16c6331f818', 'Portuguese', 'PT', 'https://flagsapi.com/PT/flat/64.png'),
	('26368695-99e5-4279-b3ba-f1afb50fdc16', 'Quechua', 'PE', 'https://flagsapi.com/PE/flat/64.png'),
	('2f8307c8-81fd-4b41-b1eb-334f50b1bd58', 'Rhaeto-Romance', 'CH', 'https://flagsapi.com/CH/flat/64.png'),
	('71737981-e23d-40af-8b1e-a94fd6b4fcc6', 'Kirundi', 'BI', 'https://flagsapi.com/BI/flat/64.png'),
	('fce3af73-fdd7-48df-8f7d-b2b63a4168b4', 'Romanian', 'RO', 'https://flagsapi.com/RO/flat/64.png'),
	('3c5609dd-e2f2-49ff-b0fd-93a7e53f711d', 'Russian', 'RU', 'https://flagsapi.com/RU/flat/64.png'),
	('3c0c7525-9be3-443f-bf64-87d1e3f1be81', 'Kinyarwanda', 'RW', 'https://flagsapi.com/RW/flat/64.png'),
	('63a0b711-dd56-469e-80cd-2b326dd11350', 'Sanskrit', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('3de245e5-99e5-4d1c-b2d2-75b2d4d73c8b', 'Sindhi', 'PK', 'https://flagsapi.com/PK/flat/64.png'),
	('d55a8a7f-d929-4151-8603-7c92667764d8', 'Sangro', 'IT', 'https://flagsapi.com/IT/flat/64.png'),
	('8de0cd5a-c58c-4290-be14-81f13f9aa4e3', 'Serbo-Croatian', 'YU', 'https://flagsapi.com/YU/flat/64.png'),
	('18e8b7fb-32df-4b10-bad1-3c80159fa2f2', 'Singhalese', 'LK', 'https://flagsapi.com/LK/flat/64.png'),
	('6698e74f-7e18-4e6d-b4a0-de2efbde91a3', 'Slovak', 'SK', 'https://flagsapi.com/SK/flat/64.png'),
	('c5d74511-7f1c-4d84-9ba6-97b71166b670', 'Slovenian', 'SI', 'https://flagsapi.com/SI/flat/64.png'),
	('1375445f-f19f-40c3-8ac0-b6050c416ce4', 'Samoan', 'WS', 'https://flagsapi.com/WS/flat/64.png'),
	('bd06f2c2-6afc-47c4-b11d-2f5ac009625e', 'Shona', 'ZW', 'https://flagsapi.com/ZW/flat/64.png'),
	('a6de8fef-c371-459b-bfff-acb2b15b3e2b', 'Somali', 'SO', 'https://flagsapi.com/SO/flat/64.png'),
	('6eca9917-912f-40dd-9cf1-de9e19a6b3bc', 'Albanian', 'AL', 'https://flagsapi.com/AL/flat/64.png'),
	('7c06ee39-f229-401b-bf41-06f9070ff537', 'Serbian', 'RS', 'https://flagsapi.com/RS/flat/64.png'),
	('a0be1438-ad12-4a0a-b4b4-3022e8b8ad74', 'Siswati', 'SZ', 'https://flagsapi.com/SZ/flat/64.png'),
	('2f04e898-2548-48b1-8f42-4fc6830b2708', 'Sesotho', 'LS', 'https://flagsapi.com/LS/flat/64.png'),
	('3ec08200-4333-4481-b4c7-068b7722a901', 'Sundanese', 'ID', 'https://flagsapi.com/ID/flat/64.png'),
	('9e6bb3d0-13ef-4431-9a35-1178d9fcf7f5', 'Swedish', 'SE', 'https://flagsapi.com/SE/flat/64.png'),
	('2b62abdf-a689-43bb-b7cc-f325af66f4ab', 'Swahili', 'TZ', 'https://flagsapi.com/TZ/flat/64.png'),
	('bc904072-0599-471f-970d-b74a71a6032a', 'Tamil', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('606df57e-37ec-44ad-8576-32c152d8e5fa', 'Telugu', 'IN', 'https://flagsapi.com/IN/flat/64.png'),
	('a7e20192-dc4e-4160-8a02-c0969828a714', 'Tajik', 'TJ', 'https://flagsapi.com/TJ/flat/64.png'),
	('db35a7f1-45bf-4b36-8ecf-588286af19f2', 'Thai', 'TH', 'https://flagsapi.com/TH/flat/64.png'),
	('e12e3974-5665-4fab-b50d-82ff639b5f07', 'Tigrinya', 'ER', 'https://flagsapi.com/ER/flat/64.png'),
	('e684961a-f3eb-4a75-8e74-35ac6b7813a7', 'Turkmen', 'TM', 'https://flagsapi.com/TM/flat/64.png'),
	('afc061ca-8f85-4fa7-add2-b60544526d6d', 'Tagalog', 'PH', 'https://flagsapi.com/PH/flat/64.png'),
	('52701ab0-f28e-404e-8f6a-9f73482f4d97', 'Setswana', 'BW', 'https://flagsapi.com/BW/flat/64.png'),
	('a144745c-7c77-470f-926b-7ae807092362', 'Tonga', 'TO', 'https://flagsapi.com/TO/flat/64.png'),
	('77b39a56-b151-4f3d-8048-7633d71cdc6c', 'Turkish', 'TR', 'https://flagsapi.com/TR/flat/64.png'),
	('5c53e32e-c0e8-4881-8c32-e7eb065362bb', 'Tsonga', 'ZA', 'https://flagsapi.com/ZA/flat/64.png'),
	('dfd304e1-e045-4172-922b-044bf9dedecb', 'Tatar', 'RU', 'https://flagsapi.com/RU/flat/64.png'),
	('91b72c31-8f72-428e-9c31-c34a510562c4', 'Twi', 'GH', 'https://flagsapi.com/GH/flat/64.png'),
	('b9a53187-e879-4062-b7a6-d0cc1735d43c', 'Ukrainian', 'UA', 'https://flagsapi.com/UA/flat/64.png'),
	('3b6dbb33-aacf-44a6-847f-e99e309bb426', 'Urdu', 'PK', 'https://flagsapi.com/PK/flat/64.png'),
	('2ec45a29-818f-4871-83d0-c3e71993504c', 'Uzbek', 'UZ', 'https://flagsapi.com/UZ/flat/64.png'),
	('96033923-5552-431d-8586-7e1f73c3bc3b', 'Vietnamese', 'VN', 'https://flagsapi.com/VN/flat/64.png'),
	('cd3f7089-353f-4b0c-846d-5d55156c8b83', 'Volapuk', 'EU', 'https://flagsapi.com/EU/flat/64.png'),
	('43711099-b6fe-4f8b-8016-bdfdc6c98cab', 'Wolof', 'SN', 'https://flagsapi.com/SN/flat/64.png'),
	('042b60a2-c1ec-4134-aa78-388341df26c8', 'Xhosa', 'ZA', 'https://flagsapi.com/ZA/flat/64.png'),
	('4f9850b0-e495-4e29-9ecc-227bf98083cf', 'Yoruba', 'NG', 'https://flagsapi.com/NG/flat/64.png'),
	('349e5acc-ff1b-47d3-b048-6714a5dfe6bd', 'Chinese', 'CN', 'https://flagsapi.com/CN/flat/64.png'),
	('4df6db94-a499-4bed-9f99-acdfe2b001f9', 'Zulu', 'ZA', 'https://flagsapi.com/ZA/flat/64.png');


--
-- Data for Name: categories_translation; Type: TABLE DATA; Schema: public; Owner: postgres
-- Using French (ced37313) for Moroccan menu
--

INSERT INTO "public"."categories_translation" ("category_id", "name", "language_id") VALUES
	('8a004237-33ac-45a2-854e-00ee3d0d3b03', 'Tagines', 'ced37313-fc91-4c4d-a480-5d8081311a8e'),
	('d4140553-1136-4a0a-bcb7-936843a4b3eb', 'Boissons', 'ced37313-fc91-4c4d-a480-5d8081311a8e'),
	('ee14c0d7-e831-4124-9d82-b0b3a843e596', 'Couscous', 'ced37313-fc91-4c4d-a480-5d8081311a8e'),
	('4bade4af-2b56-43b4-be54-0fa8eefb3990', 'Grillades', 'ced37313-fc91-4c4d-a480-5d8081311a8e'),
	('14a26a98-8e3b-4e17-9c73-ecebad43d2d5', 'Patisseries', 'ced37313-fc91-4c4d-a480-5d8081311a8e');


--
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: postgres
-- Moroccan dishes with MAD prices (in centimes)
--

INSERT INTO "public"."dishes" ("id", "price", "picture_url", "created_at", "menu_id", "category_id", "carbohydrates", "fats", "protein", "weight", "calories") VALUES
	('94ac4e49-3750-455a-ac96-526573fd666c', 5500, NULL, '2023-10-22 22:51:18.312+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '8a004237-33ac-45a2-854e-00ee3d0d3b03', NULL, NULL, NULL, NULL, NULL),
	('201a1d71-c828-4b86-b312-c8b198cb1efd', 6500, NULL, '2023-10-22 22:29:33.087+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '8a004237-33ac-45a2-854e-00ee3d0d3b03', 35, 20, 30, 450, 420),
	('cd98ede6-3544-49c2-93c2-54a5e62709bd', 7000, NULL, '2023-10-25 17:52:02.571+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'ee14c0d7-e831-4124-9d82-b0b3a843e596', 55, 15, 25, 500, 450),
	('5fa64535-6966-48c3-97f1-c7c7060a8269', 2000, NULL, '2023-10-25 17:53:36.826+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'd4140553-1136-4a0a-bcb7-936843a4b3eb', NULL, NULL, NULL, NULL, NULL),
	('2dd2eb7c-1016-4693-b220-fa2154a5965c', 1500, NULL, '2023-10-25 17:56:29.023+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'd4140553-1136-4a0a-bcb7-936843a4b3eb', NULL, NULL, NULL, NULL, NULL),
	('86aa5671-89d0-4b0b-941d-b2d128b1d4d5', 2500, NULL, '2023-10-25 17:56:37.028+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'd4140553-1136-4a0a-bcb7-936843a4b3eb', NULL, NULL, NULL, NULL, NULL),
	('c63b7ea0-acdc-4a13-afdf-46645bc2516b', 3000, NULL, '2023-10-25 17:56:42.686+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'd4140553-1136-4a0a-bcb7-936843a4b3eb', NULL, NULL, NULL, NULL, NULL),
	('33f893a6-322e-4fd5-915f-6e792cc83eaa', 8000, NULL, '2023-10-25 19:11:20.77+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'ee14c0d7-e831-4124-9d82-b0b3a843e596', NULL, NULL, NULL, NULL, NULL),
	('1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', 5000, NULL, '2023-10-26 16:45:33.556+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '4bade4af-2b56-43b4-be54-0fa8eefb3990', NULL, NULL, NULL, NULL, NULL),
	('c2c8e246-e1b7-456a-ad94-6c29e9d3337e', 4500, NULL, '2023-10-26 16:47:13.307+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '4bade4af-2b56-43b4-be54-0fa8eefb3990', NULL, NULL, NULL, NULL, NULL),
	('cea72e87-492c-437b-9eb1-5a08c0c1381d', 6000, NULL, '2023-10-26 17:07:19.806+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '14a26a98-8e3b-4e17-9c73-ecebad43d2d5', NULL, NULL, NULL, NULL, NULL),
	('69d2c84f-3056-4e0b-b130-df33a5d6f18f', 3500, NULL, '2023-10-26 17:08:20.508+00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '14a26a98-8e3b-4e17-9c73-ecebad43d2d5', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: dish_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dish_variants" ("id", "price", "dish_id", "created_at") VALUES
	('0253a1ac-bc0d-43c1-82d4-179c12f4d127', 7500, '201a1d71-c828-4b86-b312-c8b198cb1efd', '2023-10-22 22:37:40.584+00'),
	('9961c225-6f87-45b9-a04a-89bd046b730d', 8500, 'cd98ede6-3544-49c2-93c2-54a5e62709bd', '2023-10-25 17:52:19.725+00'),
	('d5b8fd89-3020-4657-bf2a-0a51be642069', 9000, 'cd98ede6-3544-49c2-93c2-54a5e62709bd', '2023-10-25 17:52:39.021+00');


--
-- Data for Name: dishes_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dishes_tag" ("dish_id", "tag_name") VALUES
	('cd98ede6-3544-49c2-93c2-54a5e62709bd', 'high_fiber'),
	('1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', 'organic');


--
-- Data for Name: dishes_translation; Type: TABLE DATA; Schema: public; Owner: postgres
-- French translations for Moroccan dishes
--

INSERT INTO "public"."dishes_translation" ("dish_id", "language_id", "name", "description") VALUES
	('94ac4e49-3750-455a-ac96-526573fd666c', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Tagine Poulet Citron', 'Tagine de poulet aux citrons confits et olives'),
	('201a1d71-c828-4b86-b312-c8b198cb1efd', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Tagine Agneau Pruneaux', 'Tagine d''agneau aux pruneaux et amandes grill&eacute;es'),
	('cd98ede6-3544-49c2-93c2-54a5e62709bd', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Couscous Royal', 'Couscous aux sept l&eacute;gumes, agneau, poulet et merguez'),
	('5fa64535-6966-48c3-97f1-c7c7060a8269', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Th&eacute; &agrave; la Menthe', 'Th&eacute; vert &agrave; la menthe fra&icirc;che, servi traditionnel'),
	('2dd2eb7c-1016-4693-b220-fa2154a5965c', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Jus d''Orange Frais', NULL),
	('86aa5671-89d0-4b0b-941d-b2d128b1d4d5', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Avocado Smoothie', NULL),
	('c63b7ea0-acdc-4a13-afdf-46645bc2516b', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Limonade Maison', NULL),
	('33f893a6-322e-4fd5-915f-6e792cc83eaa', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Couscous Tfaya', 'Couscous aux oignons caram&eacute;lis&eacute;s et raisins secs'),
	('1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Brochettes Mixtes', 'Brochettes de viande hach&eacute;e et poulet marin&eacute;'),
	('c2c8e246-e1b7-456a-ad94-6c29e9d3337e', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Kefta Grill&eacute;e', 'Boulettes de viande &eacute;pic&eacute;es grill&eacute;es'),
	('cea72e87-492c-437b-9eb1-5a08c0c1381d', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Cornes de Gazelle', 'P&acirc;tisserie traditionnelle aux amandes'),
	('69d2c84f-3056-4e0b-b130-df33a5d6f18f', 'ced37313-fc91-4c4d-a480-5d8081311a8e', 'Baghrir au Miel', 'Cr&ecirc;pes mille trous au miel et beurre');


--
-- Data for Name: menu_languages; Type: TABLE DATA; Schema: public; Owner: postgres
-- French as default menu language
--

INSERT INTO "public"."menu_languages" ("menu_id", "language_id", "is_default") VALUES
	('dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'ced37313-fc91-4c4d-a480-5d8081311a8e', true);


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: variant_translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."variant_translations" ("language_id", "dish_variant_id", "name", "description") VALUES
	('ced37313-fc91-4c4d-a480-5d8081311a8e', '0253a1ac-bc0d-43c1-82d4-179c12f4d127', 'Portion Familiale', 'Pour 4 personnes'),
	('ced37313-fc91-4c4d-a480-5d8081311a8e', '9961c225-6f87-45b9-a04a-89bd046b730d', 'Couscous V&eacute;g&eacute;tarien', 'Sans viande, extra l&eacute;gumes'),
	('ced37313-fc91-4c4d-a480-5d8081311a8e', 'd5b8fd89-3020-4657-bf2a-0a51be642069', 'Couscous Complet', 'Avec toutes les viandes');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types") VALUES
	('menus-files', 'menus-files', NULL, '2023-10-22 21:33:20.142809+00', '2023-10-22 21:33:20.142809+00', false, false, NULL, NULL) ON CONFLICT (id) DO NOTHING;


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
-- (Removed old storage objects - they reference signed URLs that expired)
--


-- ════════════════════════════════════════════════════════════════
-- EXPANDED SEED DATA
-- All data below references existing IDs:
--   user_id:  7042152a-7151-49f1-9bfd-3d8f156e7aef
--   menu_id:  dce57fbd-29dc-47a2-9a45-3a0dcc10c95a
--   French language_id: ced37313-fc91-4c4d-a480-5d8081311a8e
--   Arabic language_id: 70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a
--   English language_id: 56ef000f-2a05-41ab-bbfa-6f1a619306ed
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- Section: English and Arabic translations for existing categories
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."categories_translation" ("category_id", "name", "language_id") VALUES
	('8a004237-33ac-45a2-854e-00ee3d0d3b03', 'Tagines', '56ef000f-2a05-41ab-bbfa-6f1a619306ed'),
	('d4140553-1136-4a0a-bcb7-936843a4b3eb', 'Drinks', '56ef000f-2a05-41ab-bbfa-6f1a619306ed'),
	('ee14c0d7-e831-4124-9d82-b0b3a843e596', 'Couscous', '56ef000f-2a05-41ab-bbfa-6f1a619306ed'),
	('4bade4af-2b56-43b4-be54-0fa8eefb3990', 'Grills', '56ef000f-2a05-41ab-bbfa-6f1a619306ed'),
	('14a26a98-8e3b-4e17-9c73-ecebad43d2d5', 'Pastries', '56ef000f-2a05-41ab-bbfa-6f1a619306ed')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."categories_translation" ("category_id", "name", "language_id") VALUES
	('8a004237-33ac-45a2-854e-00ee3d0d3b03', 'طاجين', '70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a'),
	('d4140553-1136-4a0a-bcb7-936843a4b3eb', 'مشروبات', '70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a'),
	('ee14c0d7-e831-4124-9d82-b0b3a843e596', 'كسكس', '70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a'),
	('4bade4af-2b56-43b4-be54-0fa8eefb3990', 'مشويات', '70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a'),
	('14a26a98-8e3b-4e17-9c73-ecebad43d2d5', 'حلويات', '70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: English translations for existing dishes
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."dishes_translation" ("dish_id", "language_id", "name", "description") VALUES
	('94ac4e49-3750-455a-ac96-526573fd666c', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Chicken Lemon Tagine', 'Chicken tagine with preserved lemons and olives'),
	('201a1d71-c828-4b86-b312-c8b198cb1efd', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Lamb Prune Tagine', 'Lamb tagine with prunes and toasted almonds'),
	('cd98ede6-3544-49c2-93c2-54a5e62709bd', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Royal Couscous', 'Couscous with seven vegetables, lamb, chicken, and merguez'),
	('5fa64535-6966-48c3-97f1-c7c7060a8269', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Mint Tea', 'Traditional fresh mint green tea'),
	('2dd2eb7c-1016-4693-b220-fa2154a5965c', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Fresh Orange Juice', NULL),
	('86aa5671-89d0-4b0b-941d-b2d128b1d4d5', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Avocado Smoothie', NULL),
	('c63b7ea0-acdc-4a13-afdf-46645bc2516b', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Homemade Lemonade', NULL),
	('33f893a6-322e-4fd5-915f-6e792cc83eaa', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Tfaya Couscous', 'Couscous with caramelized onions and raisins'),
	('1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Mixed Brochettes', 'Minced meat and marinated chicken skewers'),
	('c2c8e246-e1b7-456a-ad94-6c29e9d3337e', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Grilled Kefta', 'Spiced grilled meatballs'),
	('cea72e87-492c-437b-9eb1-5a08c0c1381d', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Gazelle Horns', 'Traditional almond pastry'),
	('69d2c84f-3056-4e0b-b130-df33a5d6f18f', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'Baghrir with Honey', 'Thousand-hole crepes with honey and butter')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Additional menu languages (English and Arabic)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."menu_languages" ("menu_id", "language_id", "is_default") VALUES
	('dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '56ef000f-2a05-41ab-bbfa-6f1a619306ed', false),
	('dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a', false)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Restaurant
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."restaurants" ("id", "user_id", "name", "description", "logo_url", "website", "cuisine_type", "is_chain", "created_at", "updated_at") VALUES
	('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'Riad Marrakech', 'Authentic Moroccan cuisine in the heart of the city. Traditional tagines, couscous, and pastries prepared with love and the finest local ingredients.', NULL, 'https://riadmarrakech.ma', 'Moroccan Traditional', true, '2023-10-20 10:00:00+00', '2026-01-15 12:00:00+00')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Locations (2 locations for the restaurant)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."locations" ("id", "restaurant_id", "name", "address", "city", "state", "country", "postal_code", "latitude", "longitude", "phone", "email", "timezone", "is_active", "created_at", "updated_at") VALUES
	('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Riad Marrakech - Gueliz', '42 Rue de la Liberte, Gueliz', 'Marrakech', 'Marrakech-Safi', 'Morocco', '40000', 31.63420000, -8.00770000, '+212524432100', 'gueliz@riadmarrakech.ma', 'Africa/Casablanca', true, '2023-10-20 10:00:00+00', '2026-01-15 12:00:00+00'),
	('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Riad Marrakech - Ville Nouvelle', '15 Boulevard Mohammed V', 'Casablanca', 'Casablanca-Settat', 'Morocco', '20250', 33.58930000, -7.60330000, '+212522123456', 'casa@riadmarrakech.ma', 'Africa/Casablanca', true, '2023-10-22 10:00:00+00', '2026-01-15 12:00:00+00')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Operating hours for both locations
-- ────────────────────────────────────────────────────────────────

-- Gueliz location hours
INSERT INTO "public"."operating_hours" ("id", "location_id", "day_of_week", "open_time", "close_time", "is_closed") VALUES
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'monday', '11:00:00', '23:00:00', false),
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f81', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'tuesday', '11:00:00', '23:00:00', false),
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f82', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'wednesday', '11:00:00', '23:00:00', false),
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f83', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'thursday', '11:00:00', '23:00:00', false),
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f84', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'friday', '11:00:00', '23:30:00', false),
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f85', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'saturday', '10:00:00', '23:30:00', false),
	('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f86', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'sunday', '10:00:00', '22:00:00', false)
ON CONFLICT DO NOTHING;

-- Casablanca location hours
INSERT INTO "public"."operating_hours" ("id", "location_id", "day_of_week", "open_time", "close_time", "is_closed") VALUES
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'monday', '12:00:00', '22:30:00', false),
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8092', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'tuesday', '12:00:00', '22:30:00', false),
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8093', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'wednesday', '12:00:00', '22:30:00', false),
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8094', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'thursday', '12:00:00', '22:30:00', false),
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8095', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'friday', '12:00:00', '23:00:00', false),
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8096', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'saturday', '11:00:00', '23:00:00', false),
	('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8097', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'sunday', '11:00:00', '21:30:00', false)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Table zones (for both locations)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."table_zones" ("id", "location_id", "table_number", "zone_name", "capacity", "is_active") VALUES
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809101', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'T1', 'Terrace', 4, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'T2', 'Terrace', 6, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809103', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'I1', 'Indoor', 2, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809104', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'I2', 'Indoor', 4, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809105', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'P1', 'Private Room', 8, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809110', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'A1', 'Main Hall', 4, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809111', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'A2', 'Main Hall', 4, true),
	('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'B1', 'Courtyard', 6, true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Link the menu to the restaurant and Marrakech location
-- ────────────────────────────────────────────────────────────────

UPDATE "public"."menus"
SET restaurant_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    location_id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    whatsapp_number = '+212661234567',
    facebook_url = 'https://facebook.com/riadmarrakech',
    instagram_url = 'https://instagram.com/riadmarrakech',
    google_review_url = 'https://g.page/riadmarrakech/review',
    rating = 4.5,
    review_count = 10,
    view_count = 847,
    price_range = 2,
    is_featured = true
WHERE id = 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a';


-- ────────────────────────────────────────────────────────────────
-- Section: Orders (12 orders over last 30 days)
-- Uses NOW() - INTERVAL for realistic relative dates
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."orders" ("id", "menu_id", "status", "total_amount", "currency", "customer_name", "customer_phone", "customer_notes", "table_number", "location_id", "created_at", "updated_at", "completed_at") VALUES
	('01010101-0101-4101-8101-010101010101', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 18500, 'MAD', 'Youssef Benali', '+212661111111', NULL, 'T1', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
	('01010101-0101-4101-8101-010101010102', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 25000, 'MAD', 'Fatima Zahra', '+212662222222', 'No spicy please', 'I2', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
	('01010101-0101-4101-8101-010101010103', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 12000, 'MAD', 'Mohammed Alami', '+212663333333', NULL, 'T2', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
	('01010101-0101-4101-8101-010101010104', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 34500, 'MAD', 'Sarah Johnson', '+44771234567', 'Tourist group, need English menu', 'P1', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
	('01010101-0101-4101-8101-010101010105', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 9000, 'MAD', 'Ahmed Rachid', '+212664444444', NULL, 'I1', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
	('01010101-0101-4101-8101-010101010106', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'cancelled', 7000, 'MAD', 'Karim Mansouri', '+212665555555', 'Had to leave early', NULL, NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NULL),
	('01010101-0101-4101-8101-010101010107', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 16000, 'MAD', 'Leila Tazi', '+212666666666', 'Allergic to nuts', 'A1', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
	('01010101-0101-4101-8101-010101010108', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'completed', 21000, 'MAD', 'Pierre Dupont', '+33612345678', NULL, 'B1', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
	('01010101-0101-4101-8101-010101010109', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'ready', 13500, 'MAD', 'Amina Berrada', '+212667777777', NULL, 'T1', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL),
	('01010101-0101-4101-8101-010101010110', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'preparing', 19500, 'MAD', 'Hassan Ouazzani', '+212668888888', 'Extra bread please', 'I2', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),
	('01010101-0101-4101-8101-010101010111', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'confirmed', 11000, 'MAD', 'Nadia El Fassi', '+212669999999', NULL, 'A2', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NULL),
	('01010101-0101-4101-8101-010101010112', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'pending', 15500, 'MAD', 'Omar Benjelloun', '+212660000000', 'Birthday celebration', 'T2', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NULL)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Order items (referencing existing dish IDs)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."order_items" ("id", "order_id", "dish_id", "dish_variant_id", "dish_name", "quantity", "unit_price", "total_price", "notes") VALUES
	-- Order 1: Tagine Poulet + Mint Tea = 5500 + 2000*2 + 9000(couscous) = 18500
	('02020202-0202-4202-8202-020202020201', '01010101-0101-4101-8101-010101010101', '94ac4e49-3750-455a-ac96-526573fd666c', NULL, 'Tagine Poulet Citron', 1, 5500, 5500, NULL),
	('02020202-0202-4202-8202-020202020202', '01010101-0101-4101-8101-010101010101', '5fa64535-6966-48c3-97f1-c7c7060a8269', NULL, 'Mint Tea', 2, 2000, 4000, NULL),
	('02020202-0202-4202-8202-020202020203', '01010101-0101-4101-8101-010101010101', 'cd98ede6-3544-49c2-93c2-54a5e62709bd', 'd5b8fd89-3020-4657-bf2a-0a51be642069', 'Couscous Royal - Complet', 1, 9000, 9000, NULL),
	-- Order 2: 2x Tagine Agneau + 2x Couscous Royal = 6500*2 + 7000 + 5000 = 25000
	('02020202-0202-4202-8202-020202020204', '01010101-0101-4101-8101-010101010102', '201a1d71-c828-4b86-b312-c8b198cb1efd', NULL, 'Tagine Agneau Pruneaux', 2, 6500, 13000, NULL),
	('02020202-0202-4202-8202-020202020205', '01010101-0101-4101-8101-010101010102', 'cd98ede6-3544-49c2-93c2-54a5e62709bd', NULL, 'Couscous Royal', 1, 7000, 7000, NULL),
	('02020202-0202-4202-8202-020202020206', '01010101-0101-4101-8101-010101010102', '1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', NULL, 'Brochettes Mixtes', 1, 5000, 5000, NULL),
	-- Order 3: Brochettes + Kefta + Mint Tea = 5000 + 4500 + 2000 + 500(extra) = 12000
	('02020202-0202-4202-8202-020202020207', '01010101-0101-4101-8101-010101010103', '1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', NULL, 'Brochettes Mixtes', 1, 5000, 5000, NULL),
	('02020202-0202-4202-8202-020202020208', '01010101-0101-4101-8101-010101010103', 'c2c8e246-e1b7-456a-ad94-6c29e9d3337e', NULL, 'Kefta Grillee', 1, 4500, 4500, NULL),
	('02020202-0202-4202-8202-020202020209', '01010101-0101-4101-8101-010101010103', '86aa5671-89d0-4b0b-941d-b2d128b1d4d5', NULL, 'Avocado Smoothie', 1, 2500, 2500, NULL),
	-- Order 4: Tourist group - large order
	('02020202-0202-4202-8202-020202020210', '01010101-0101-4101-8101-010101010104', '94ac4e49-3750-455a-ac96-526573fd666c', NULL, 'Tagine Poulet Citron', 2, 5500, 11000, NULL),
	('02020202-0202-4202-8202-020202020211', '01010101-0101-4101-8101-010101010104', '33f893a6-322e-4fd5-915f-6e792cc83eaa', NULL, 'Couscous Tfaya', 2, 8000, 16000, NULL),
	('02020202-0202-4202-8202-020202020212', '01010101-0101-4101-8101-010101010104', '201a1d71-c828-4b86-b312-c8b198cb1efd', '0253a1ac-bc0d-43c1-82d4-179c12f4d127', 'Tagine Agneau - Familiale', 1, 7500, 7500, NULL),
	-- Order 5: Simple order
	('02020202-0202-4202-8202-020202020213', '01010101-0101-4101-8101-010101010105', 'cea72e87-492c-437b-9eb1-5a08c0c1381d', NULL, 'Cornes de Gazelle', 1, 6000, 6000, NULL),
	('02020202-0202-4202-8202-020202020214', '01010101-0101-4101-8101-010101010105', 'c63b7ea0-acdc-4a13-afdf-46645bc2516b', NULL, 'Limonade Maison', 1, 3000, 3000, NULL),
	-- Order 6: Cancelled order
	('02020202-0202-4202-8202-020202020215', '01010101-0101-4101-8101-010101010106', 'cd98ede6-3544-49c2-93c2-54a5e62709bd', NULL, 'Couscous Royal', 1, 7000, 7000, NULL),
	-- Order 7: Casablanca location
	('02020202-0202-4202-8202-020202020216', '01010101-0101-4101-8101-010101010107', '94ac4e49-3750-455a-ac96-526573fd666c', NULL, 'Tagine Poulet Citron', 1, 5500, 5500, NULL),
	('02020202-0202-4202-8202-020202020217', '01010101-0101-4101-8101-010101010107', '1c4e69eb-373e-4fe2-91a4-89fd7c015d4a', NULL, 'Brochettes Mixtes', 1, 5000, 5000, NULL),
	('02020202-0202-4202-8202-020202020218', '01010101-0101-4101-8101-010101010107', '69d2c84f-3056-4e0b-b130-df33a5d6f18f', NULL, 'Baghrir au Miel', 1, 3500, 3500, NULL),
	('02020202-0202-4202-8202-020202020219', '01010101-0101-4101-8101-010101010107', '5fa64535-6966-48c3-97f1-c7c7060a8269', NULL, 'Mint Tea', 1, 2000, 2000, NULL),
	-- Order 8: French tourist
	('02020202-0202-4202-8202-020202020220', '01010101-0101-4101-8101-010101010108', '201a1d71-c828-4b86-b312-c8b198cb1efd', NULL, 'Tagine Agneau Pruneaux', 2, 6500, 13000, NULL),
	('02020202-0202-4202-8202-020202020221', '01010101-0101-4101-8101-010101010108', '33f893a6-322e-4fd5-915f-6e792cc83eaa', NULL, 'Couscous Tfaya', 1, 8000, 8000, NULL),
	-- Order 9: Ready order
	('02020202-0202-4202-8202-020202020222', '01010101-0101-4101-8101-010101010109', '94ac4e49-3750-455a-ac96-526573fd666c', NULL, 'Tagine Poulet Citron', 1, 5500, 5500, NULL),
	('02020202-0202-4202-8202-020202020223', '01010101-0101-4101-8101-010101010109', '33f893a6-322e-4fd5-915f-6e792cc83eaa', NULL, 'Couscous Tfaya', 1, 8000, 8000, NULL),
	-- Order 10: Preparing
	('02020202-0202-4202-8202-020202020224', '01010101-0101-4101-8101-010101010110', 'cd98ede6-3544-49c2-93c2-54a5e62709bd', NULL, 'Couscous Royal', 1, 7000, 7000, NULL),
	('02020202-0202-4202-8202-020202020225', '01010101-0101-4101-8101-010101010110', '201a1d71-c828-4b86-b312-c8b198cb1efd', NULL, 'Tagine Agneau Pruneaux', 1, 6500, 6500, NULL),
	('02020202-0202-4202-8202-020202020226', '01010101-0101-4101-8101-010101010110', 'cea72e87-492c-437b-9eb1-5a08c0c1381d', NULL, 'Cornes de Gazelle', 1, 6000, 6000, NULL),
	-- Order 11: Confirmed
	('02020202-0202-4202-8202-020202020227', '01010101-0101-4101-8101-010101010111', '94ac4e49-3750-455a-ac96-526573fd666c', NULL, 'Tagine Poulet Citron', 2, 5500, 11000, NULL),
	-- Order 12: Pending (birthday)
	('02020202-0202-4202-8202-020202020228', '01010101-0101-4101-8101-010101010112', '33f893a6-322e-4fd5-915f-6e792cc83eaa', NULL, 'Couscous Tfaya', 1, 8000, 8000, NULL),
	('02020202-0202-4202-8202-020202020229', '01010101-0101-4101-8101-010101010112', 'cea72e87-492c-437b-9eb1-5a08c0c1381d', NULL, 'Cornes de Gazelle', 1, 6000, 6000, NULL),
	('02020202-0202-4202-8202-020202020230', '01010101-0101-4101-8101-010101010112', '2dd2eb7c-1016-4693-b220-fa2154a5965c', NULL, 'Fresh Orange Juice', 1, 1500, 1500, NULL)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Reviews (10 reviews, mix of ratings and statuses)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."reviews" ("id", "menu_id", "location_id", "customer_name", "customer_email", "rating", "comment", "status", "response", "responded_at", "created_at", "updated_at") VALUES
	('03030303-0303-4303-8303-030303030301', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Marie Laurent', 'marie@example.com', 5, 'Absolutely incredible tagine! The preserved lemons were perfectly balanced. We felt like we were dining in a real Moroccan riad. The mint tea service was authentic and beautiful. Will definitely return on our next trip to Marrakech.', 'approved', 'Thank you so much Marie! We are delighted you enjoyed our tagine and the traditional mint tea experience. We look forward to welcoming you back!', NOW() - INTERVAL '27 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days'),
	('03030303-0303-4303-8303-030303030302', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Youssef Tahiri', 'youssef.t@example.com', 5, 'The couscous royal was generous and perfectly cooked. Seven vegetables, tender lamb, crispy merguez. This is how couscous should be. The best in Gueliz without a doubt.', 'approved', 'Shukran Youssef! Couscous is our pride and joy. We take great care in preparing it the traditional way. See you again soon!', NOW() - INTERVAL '23 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days'),
	('03030303-0303-4303-8303-030303030303', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'James Wilson', 'james.w@example.com', 4, 'Great food and lovely atmosphere. The brochettes were juicy and well-seasoned. Only thing is the service was a bit slow when it got busy on Friday night. But the quality of the food made up for it.', 'approved', 'Thank you James for the honest feedback! We are working on improving our Friday evening service. Glad the brochettes met your expectations!', NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),
	('03030303-0303-4303-8303-030303030304', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Samira El Idrissi', 'samira@example.com', 5, 'Finally a real Moroccan restaurant in Casablanca that does not cut corners. The kefta was seasoned perfectly and the gazelle horns were fresh, not from a box. My family loved every dish.', 'approved', NULL, NULL, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
	('03030303-0303-4303-8303-030303030305', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Hans Mueller', 'hans@example.com', 4, 'Visited during our Morocco trip. The QR code menu was very convenient since it had English translations. The tagine with prunes and almonds was a highlight. Good value for money.', 'approved', 'Welcome Hans! We are glad our multi-language menu made your experience easier. The lamb and prune tagine is one of our most popular dishes!', NOW() - INTERVAL '13 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'),
	('03030303-0303-4303-8303-030303030306', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Aisha Bennani', NULL, 3, 'The food is good but portions could be larger for the price. The couscous tfaya was delicious though. The ambiance is nice.', 'approved', 'Thank you for your feedback Aisha. We have noted your comment about portions and are reviewing our serving sizes. We appreciate your honesty!', NOW() - INTERVAL '10 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days'),
	('03030303-0303-4303-8303-030303030307', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Kamal Ouazzani', 'kamal@example.com', 5, 'Outstanding baghrir with honey. Took my parents here for their anniversary and the private dining area was perfect. Staff was attentive and knew the menu well.', 'approved', NULL, NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
	('03030303-0303-4303-8303-030303030308', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Sophie Martin', 'sophie.m@example.com', 4, 'Charming restaurant with authentic decor. The avocado smoothie was surprisingly good. Tagine chicken was perfectly tender. Could use a bit more spice for my taste.', 'approved', NULL, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
	('03030303-0303-4303-8303-030303030309', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Rachid Amrani', 'rachid@example.com', 3, 'Decent food but I have had better tagines elsewhere. The tea was excellent though. The location is convenient and easy to find.', 'pending', NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
	('03030303-0303-4303-8303-030303030310', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Elena Rodriguez', 'elena@example.com', 5, 'Best Moroccan food I have tried outside of a home kitchen. The couscous royal was divine and the cornes de gazelle melted in my mouth. Already planning my next visit!', 'pending', NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Promotions (4 promotions)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."promotions" ("id", "restaurant_id", "title", "description", "promotion_type", "discount_percent", "discount_amount", "start_date", "end_date", "is_active", "applicable_days", "start_time", "end_time", "menu_id", "dish_id", "category_id", "created_at", "updated_at") VALUES
	-- Active daily special: Couscous Friday
	('04040404-0404-4404-8404-040404040401', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Couscous Friday', 'Traditional Friday couscous special! Enjoy 15% off all couscous dishes every Friday, following the beloved Moroccan tradition.', 'daily_special', 15, NULL, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', true, ARRAY['friday']::public.day_of_week[], '11:30:00', '15:00:00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'ee14c0d7-e831-4124-9d82-b0b3a843e596', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
	-- Active happy hour
	('04040404-0404-4404-8404-040404040402', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Sunset Happy Hour', 'Fresh juices and smoothies at 20% off during the golden hour. Perfect way to end a day exploring the medina.', 'happy_hour', 20, NULL, NOW() - INTERVAL '14 days', NOW() + INTERVAL '45 days', true, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::public.day_of_week[], '17:00:00', '19:00:00', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'd4140553-1136-4a0a-bcb7-936843a4b3eb', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
	-- Active combo deal
	('04040404-0404-4404-8404-040404040403', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Tagine & Tea Combo', 'Order any tagine and get a traditional mint tea for free! A perfect pairing of Moroccan flavors.', 'combo', NULL, 2000, NOW() - INTERVAL '7 days', NOW() + INTERVAL '30 days', true, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::public.day_of_week[], NULL, NULL, 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, '8a004237-33ac-45a2-854e-00ee3d0d3b03', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
	-- Expired promotion
	('04040404-0404-4404-8404-040404040404', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Grand Opening Special', '25% off everything to celebrate our Casablanca opening! Limited time only.', 'discount', 25, NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', false, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::public.day_of_week[], NULL, NULL, 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Staff members (3 staff + owner)
-- We need additional auth users and profiles for staff.
-- We create placeholder profiles that reference the same auth user
-- since supabase seed cannot easily create multiple auth users.
-- Instead, we link staff members to the existing owner profile
-- with different roles to demonstrate the feature.
-- ────────────────────────────────────────────────────────────────

-- Create additional auth users for staff
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at") VALUES
	('00000000-0000-0000-0000-000000000000', 'aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', 'authenticated', 'authenticated', 'ahmed.manager@example.com', '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S', '2023-11-01 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-11-05 14:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-11-01 10:00:00+00', '2023-11-05 14:00:00+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
	('00000000-0000-0000-0000-000000000000', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'authenticated', 'authenticated', 'fatima.staff@example.com', '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S', '2023-11-02 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-11-06 14:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-11-02 10:00:00+00', '2023-11-06 14:00:00+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL),
	('00000000-0000-0000-0000-000000000000', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'authenticated', 'authenticated', 'karim.staff@example.com', '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S', '2023-11-03 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL, '2023-11-07 14:00:00+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2023-11-03 10:00:00+00', '2023-11-07 14:00:00+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "auth"."identities" ("id", "user_id", "provider_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at") VALUES
	('aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', 'aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', 'aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', '{"sub": "aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff", "email": "ahmed.manager@example.com"}', 'email', '2023-11-01 10:00:00+00', '2023-11-01 10:00:00+00', '2023-11-01 10:00:00+00'),
	('aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', '{"sub": "aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff", "email": "fatima.staff@example.com"}', 'email', '2023-11-02 10:00:00+00', '2023-11-02 10:00:00+00', '2023-11-02 10:00:00+00'),
	('aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', '{"sub": "aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff", "email": "karim.staff@example.com"}', 'email', '2023-11-03 10:00:00+00', '2023-11-03 10:00:00+00', '2023-11-03 10:00:00+00')
ON CONFLICT DO NOTHING;

-- Profiles for staff users
INSERT INTO "public"."profiles" ("id", "updated_at", "username", "full_name", "email", "role") VALUES
	('aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', '2023-11-01 10:00:00+00', 'ahmed_mgr', 'Ahmed Benali', 'ahmed.manager@example.com', 'manager'),
	('aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', '2023-11-02 10:00:00+00', 'fatima_s', 'Fatima Chaoui', 'fatima.staff@example.com', 'staff'),
	('aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', '2023-11-03 10:00:00+00', 'karim_s', 'Karim Lahlou', 'karim.staff@example.com', 'staff')
ON CONFLICT (id) DO NOTHING;

-- Staff member records
INSERT INTO "public"."staff_members" ("id", "menu_id", "user_id", "role", "invited_by", "invited_at", "accepted_at", "is_active", "created_at", "updated_at") VALUES
	('05050505-0505-4505-8505-050505050501', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', 'manager', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '2023-11-01 10:00:00+00', '2023-11-01 12:00:00+00', true, '2023-11-01 10:00:00+00', '2023-11-01 12:00:00+00'),
	('05050505-0505-4505-8505-050505050502', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'staff', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '2023-11-02 10:00:00+00', '2023-11-02 15:00:00+00', true, '2023-11-02 10:00:00+00', '2023-11-02 15:00:00+00'),
	('05050505-0505-4505-8505-050505050503', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'staff', 'aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', '2023-11-03 10:00:00+00', '2023-11-03 11:30:00+00', true, '2023-11-03 10:00:00+00', '2023-11-03 11:30:00+00')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Analytics events (30 events spread over 30 days)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."analytics_events" ("id", "menu_id", "location_id", "event_type", "event_data", "session_id", "user_agent", "ip_hash", "referrer", "created_at") VALUES
	-- Menu views
	('06060606-0606-4606-8606-060606060601', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "Marrakech", "language": "fr"}', 'sess-001', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'abc123', NULL, NOW() - INTERVAL '29 days'),
	('06060606-0606-4606-8606-060606060602', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "Marrakech", "language": "en"}', 'sess-002', 'Mozilla/5.0 (Linux; Android 14)', 'def456', 'https://google.com', NOW() - INTERVAL '27 days'),
	('06060606-0606-4606-8606-060606060603', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'menu_view', '{"device": "desktop", "city": "Casablanca", "language": "fr"}', 'sess-003', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'ghi789', NULL, NOW() - INTERVAL '25 days'),
	('06060606-0606-4606-8606-060606060604', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "Marrakech", "language": "ar"}', 'sess-004', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)', 'jkl012', NULL, NOW() - INTERVAL '22 days'),
	('06060606-0606-4606-8606-060606060605', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "tablet", "city": "Paris", "language": "fr"}', 'sess-005', 'Mozilla/5.0 (iPad; CPU OS 17_0)', 'mno345', 'https://tripadvisor.com', NOW() - INTERVAL '20 days'),
	('06060606-0606-4606-8606-060606060606', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "London", "language": "en"}', 'sess-006', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2)', 'pqr678', 'https://google.co.uk', NOW() - INTERVAL '18 days'),
	('06060606-0606-4606-8606-060606060607', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'menu_view', '{"device": "mobile", "city": "Casablanca", "language": "fr"}', 'sess-007', 'Mozilla/5.0 (Linux; Android 13)', 'stu901', NULL, NOW() - INTERVAL '15 days'),
	('06060606-0606-4606-8606-060606060608', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "Rabat", "language": "fr"}', 'sess-008', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1)', 'vwx234', NULL, NOW() - INTERVAL '12 days'),
	('06060606-0606-4606-8606-060606060609', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "desktop", "city": "Berlin", "language": "en"}', 'sess-009', 'Mozilla/5.0 (Windows NT 10.0)', 'yza567', 'https://instagram.com', NOW() - INTERVAL '8 days'),
	('06060606-0606-4606-8606-060606060610', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "Marrakech", "language": "fr"}', 'sess-010', 'Mozilla/5.0 (Linux; Android 14)', 'bcd890', NULL, NOW() - INTERVAL '5 days'),
	-- QR scans
	('06060606-0606-4606-8606-060606060611', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'qr_scan', '{"table": "T1", "device": "mobile"}', 'sess-011', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'efg123', NULL, NOW() - INTERVAL '28 days'),
	('06060606-0606-4606-8606-060606060612', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'qr_scan', '{"table": "I2", "device": "mobile"}', 'sess-012', 'Mozilla/5.0 (Linux; Android 14)', 'hij456', NULL, NOW() - INTERVAL '25 days'),
	('06060606-0606-4606-8606-060606060613', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'qr_scan', '{"table": "T2", "device": "mobile"}', 'sess-013', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6)', 'klm789', NULL, NOW() - INTERVAL '18 days'),
	('06060606-0606-4606-8606-060606060614', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'qr_scan', '{"table": "A1", "device": "mobile"}', 'sess-014', 'Mozilla/5.0 (Linux; Android 13)', 'nop012', NULL, NOW() - INTERVAL '10 days'),
	('06060606-0606-4606-8606-060606060615', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'qr_scan', '{"table": "P1", "device": "mobile"}', 'sess-015', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2)', 'qrs345', NULL, NOW() - INTERVAL '3 days'),
	('06060606-0606-4606-8606-060606060616', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'qr_scan', '{"table": "I1", "device": "mobile"}', 'sess-016', 'Mozilla/5.0 (Linux; Android 14)', 'tuv678', NULL, NOW() - INTERVAL '1 day'),
	-- Dish views
	('06060606-0606-4606-8606-060606060617', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "94ac4e49-3750-455a-ac96-526573fd666c", "dishName": "Tagine Poulet Citron"}', 'sess-001', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'abc123', NULL, NOW() - INTERVAL '29 days'),
	('06060606-0606-4606-8606-060606060618', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "cd98ede6-3544-49c2-93c2-54a5e62709bd", "dishName": "Couscous Royal"}', 'sess-002', 'Mozilla/5.0 (Linux; Android 14)', 'def456', NULL, NOW() - INTERVAL '27 days'),
	('06060606-0606-4606-8606-060606060619', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "201a1d71-c828-4b86-b312-c8b198cb1efd", "dishName": "Tagine Agneau Pruneaux"}', 'sess-005', 'Mozilla/5.0 (iPad; CPU OS 17_0)', 'mno345', NULL, NOW() - INTERVAL '20 days'),
	('06060606-0606-4606-8606-060606060620', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "cea72e87-492c-437b-9eb1-5a08c0c1381d", "dishName": "Cornes de Gazelle"}', 'sess-007', 'Mozilla/5.0 (Linux; Android 13)', 'stu901', NULL, NOW() - INTERVAL '15 days'),
	('06060606-0606-4606-8606-060606060621', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "1c4e69eb-373e-4fe2-91a4-89fd7c015d4a", "dishName": "Brochettes Mixtes"}', 'sess-009', 'Mozilla/5.0 (Windows NT 10.0)', 'yza567', NULL, NOW() - INTERVAL '8 days'),
	('06060606-0606-4606-8606-060606060622', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "33f893a6-322e-4fd5-915f-6e792cc83eaa", "dishName": "Couscous Tfaya"}', 'sess-010', 'Mozilla/5.0 (Linux; Android 14)', 'bcd890', NULL, NOW() - INTERVAL '5 days'),
	('06060606-0606-4606-8606-060606060623', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'dish_view', '{"dishId": "94ac4e49-3750-455a-ac96-526573fd666c", "dishName": "Tagine Poulet Citron"}', 'sess-016', 'Mozilla/5.0 (Linux; Android 14)', 'tuv678', NULL, NOW() - INTERVAL '1 day'),
	-- Order placed events
	('06060606-0606-4606-8606-060606060624', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'order_placed', '{"orderId": "01010101-0101-4101-8101-010101010101", "amount": 18500}', 'sess-011', NULL, 'efg123', NULL, NOW() - INTERVAL '28 days'),
	('06060606-0606-4606-8606-060606060625', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'order_placed', '{"orderId": "01010101-0101-4101-8101-010101010102", "amount": 25000}', 'sess-012', NULL, 'hij456', NULL, NOW() - INTERVAL '25 days'),
	('06060606-0606-4606-8606-060606060626', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'order_placed', '{"orderId": "01010101-0101-4101-8101-010101010104", "amount": 34500}', 'sess-013', NULL, 'klm789', NULL, NOW() - INTERVAL '18 days'),
	('06060606-0606-4606-8606-060606060627', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'order_placed', '{"orderId": "01010101-0101-4101-8101-010101010107", "amount": 16000}', 'sess-014', NULL, 'nop012', NULL, NOW() - INTERVAL '10 days'),
	('06060606-0606-4606-8606-060606060628', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'order_placed', '{"orderId": "01010101-0101-4101-8101-010101010110", "amount": 19500}', 'sess-015', NULL, 'qrs345', NULL, NOW() - INTERVAL '1 day'),
	('06060606-0606-4606-8606-060606060629', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'order_placed', '{"orderId": "01010101-0101-4101-8101-010101010112", "amount": 15500}', 'sess-016', NULL, 'tuv678', NULL, NOW() - INTERVAL '30 minutes'),
	-- Additional menu views for better analytics
	('06060606-0606-4606-8606-060606060630', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'menu_view', '{"device": "mobile", "city": "Fes", "language": "ar"}', 'sess-017', 'Mozilla/5.0 (Linux; Android 13)', 'wxy901', NULL, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Menu theme (custom theme for existing menu)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."menu_themes" ("id", "menu_id", "primary_color", "secondary_color", "background_color", "surface_color", "text_color", "accent_color", "heading_font", "body_font", "font_size", "layout_style", "card_style", "border_radius", "spacing", "show_images", "show_prices", "show_nutrition", "show_category_nav", "show_category_dividers", "header_style", "image_style", "custom_css", "created_at", "updated_at") VALUES
	('07070707-0707-4707-8707-070707070701', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '#C75B39', '#8B6914', '#FFF8F0', '#FFFFFF', '#2D1810', '#D4A574', 'Playfair Display', 'DM Sans', 'medium', 'classic', 'elevated', 'medium', 'comfortable', true, true, true, true, true, 'banner', 'rounded', '', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Loyalty program
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."loyalty_programs" ("id", "menu_id", "name", "description", "stamps_required", "reward_description", "reward_type", "reward_value", "is_active", "icon", "color", "created_at", "updated_at") VALUES
	('08080808-0808-4808-8808-080808080801', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'Riad Rewards', 'Collect stamps with every tagine or couscous order. Get a free dessert after 8 stamps!', 8, 'Free pastry of your choice (Cornes de Gazelle or Baghrir)', 'free_item', NULL, true, '🌟', '#C75B39', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Loyalty cards and stamps
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."loyalty_cards" ("id", "program_id", "customer_identifier", "stamps_collected", "is_redeemed", "redeemed_at", "created_at", "updated_at") VALUES
	-- Gold tier: 8 stamps, redeemed
	('09090909-0909-4909-8909-090909090901', '08080808-0808-4808-8808-080808080801', '+212661111111', 8, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '5 days'),
	-- Silver tier: 5 stamps, in progress
	('09090909-0909-4909-8909-090909090902', '08080808-0808-4808-8808-080808080801', '+212662222222', 5, false, NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '7 days'),
	-- Bronze tier: 2 stamps, new member
	('09090909-0909-4909-8909-090909090903', '08080808-0808-4808-8808-080808080801', '+212667777777', 2, false, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
	-- Just started
	('09090909-0909-4909-8909-090909090904', '08080808-0808-4808-8808-080808080801', '+212660000000', 1, false, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;


-- Stamps for the loyalty cards
INSERT INTO "public"."loyalty_stamps" ("id", "card_id", "stamped_by", "notes", "created_at") VALUES
	-- Card 1: 8 stamps (redeemed)
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a01', '09090909-0909-4909-8909-090909090901', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'Tagine Poulet', NOW() - INTERVAL '28 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a02', '09090909-0909-4909-8909-090909090901', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'Couscous Royal', NOW() - INTERVAL '25 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a03', '09090909-0909-4909-8909-090909090901', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'Tagine Agneau', NOW() - INTERVAL '22 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a04', '09090909-0909-4909-8909-090909090901', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'Couscous Tfaya', NOW() - INTERVAL '18 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a05', '09090909-0909-4909-8909-090909090901', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', NULL, NOW() - INTERVAL '15 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a06', '09090909-0909-4909-8909-090909090901', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', NULL, NOW() - INTERVAL '12 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a07', '09090909-0909-4909-8909-090909090901', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', NULL, NOW() - INTERVAL '8 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a08', '09090909-0909-4909-8909-090909090901', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'Redeemed for Cornes de Gazelle', NOW() - INTERVAL '5 days'),
	-- Card 2: 5 stamps
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a09', '09090909-0909-4909-8909-090909090902', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'Couscous Royal', NOW() - INTERVAL '25 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a10', '09090909-0909-4909-8909-090909090902', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', NULL, NOW() - INTERVAL '20 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a11', '09090909-0909-4909-8909-090909090902', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', NULL, NOW() - INTERVAL '15 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a12', '09090909-0909-4909-8909-090909090902', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', NULL, NOW() - INTERVAL '10 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a13', '09090909-0909-4909-8909-090909090902', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'Tagine Poulet', NOW() - INTERVAL '7 days'),
	-- Card 3: 2 stamps
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a14', '09090909-0909-4909-8909-090909090903', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', NULL, NOW() - INTERVAL '10 days'),
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a15', '09090909-0909-4909-8909-090909090903', 'aaaa2222-bbbb-4ccc-8ddd-eeee2222ffff', 'Couscous Royal', NOW() - INTERVAL '3 days'),
	-- Card 4: 1 stamp
	('0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a16', '09090909-0909-4909-8909-090909090904', 'aaaa3333-bbbb-4ccc-8ddd-eeee3333ffff', 'Birthday visit', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Menu schedules
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."menu_schedules" ("id", "menu_id", "category_id", "name", "schedule_type", "start_time", "end_time", "days", "is_recurring", "is_active", "created_at", "updated_at") VALUES
	-- Patisseries available for breakfast/brunch
	('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b01', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '14a26a98-8e3b-4e17-9c73-ecebad43d2d5', 'Breakfast Pastries', 'breakfast', '08:00:00', '11:00:00', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::public.day_of_week[], true, true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
	-- Couscous only at lunch on Fridays (tradition)
	('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b02', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'ee14c0d7-e831-4124-9d82-b0b3a843e596', 'Friday Couscous', 'lunch', '12:00:00', '15:00:00', ARRAY['friday']::public.day_of_week[], true, true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
	-- Full menu all day
	('0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b03', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', NULL, 'Full Menu', 'all_day', NULL, NULL, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']::public.day_of_week[], true, true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Customer favorites
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."customer_favorites" ("id", "menu_id", "dish_id", "session_id", "created_at") VALUES
	('0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c01', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '94ac4e49-3750-455a-ac96-526573fd666c', 'sess-001', NOW() - INTERVAL '29 days'),
	('0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c02', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'cd98ede6-3544-49c2-93c2-54a5e62709bd', 'sess-002', NOW() - INTERVAL '27 days'),
	('0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c03', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '201a1d71-c828-4b86-b312-c8b198cb1efd', 'sess-005', NOW() - INTERVAL '20 days'),
	('0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c04', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', 'cea72e87-492c-437b-9eb1-5a08c0c1381d', 'sess-007', NOW() - INTERVAL '15 days'),
	('0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c05', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '33f893a6-322e-4fd5-915f-6e792cc83eaa', 'sess-010', NOW() - INTERVAL '5 days'),
	('0c0c0c0c-0c0c-4c0c-8c0c-0c0c0c0c0c06', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '94ac4e49-3750-455a-ac96-526573fd666c', 'sess-009', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Audit log entries (sample app-level audit events)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."app_audit_log" ("id", "user_id", "action", "entity_type", "entity_id", "old_data", "new_data", "ip_address", "user_agent", "created_at") VALUES
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d01', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'create', 'restaurant', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, '{"name": "Riad Marrakech"}', NULL, NULL, NOW() - INTERVAL '30 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d02', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'create', 'location', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, '{"name": "Gueliz", "city": "Marrakech"}', NULL, NULL, NOW() - INTERVAL '30 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d03', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'create', 'location', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, '{"name": "Ville Nouvelle", "city": "Casablanca"}', NULL, NULL, NOW() - INTERVAL '28 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d04', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'update', 'menu', 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a', '{"is_published": false}', '{"is_published": true}', NULL, NULL, NOW() - INTERVAL '27 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d05', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'invite', 'staff', '05050505-0505-4505-8505-050505050501', NULL, '{"email": "ahmed.manager@example.com", "role": "manager"}', NULL, NULL, NOW() - INTERVAL '25 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d06', 'aaaa1111-bbbb-4ccc-8ddd-eeee1111ffff', 'update', 'order', '01010101-0101-4101-8101-010101010101', '{"status": "pending"}', '{"status": "completed"}', NULL, NULL, NOW() - INTERVAL '28 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d07', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'respond', 'review', '03030303-0303-4303-8303-030303030301', NULL, '{"response": "Thank you so much Marie!"}', NULL, NULL, NOW() - INTERVAL '27 days'),
	('0d0d0d0d-0d0d-4d0d-8d0d-0d0d0d0d0d08', '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'create', 'promotion', '04040404-0404-4404-8404-040404040401', NULL, '{"title": "Couscous Friday"}', NULL, NULL, NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Link menu to directory (city and cuisine type)
-- These use subqueries since IDs come from migration seed data
-- ────────────────────────────────────────────────────────────────

UPDATE "public"."menus"
SET city_id = (SELECT id FROM public.cities WHERE slug = 'marrakech' LIMIT 1),
    cuisine_type_id = (SELECT id FROM public.cuisine_types WHERE slug = 'moroccan-traditional' LIMIT 1)
WHERE id = 'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a'
  AND (SELECT id FROM public.cities WHERE slug = 'marrakech' LIMIT 1) IS NOT NULL;


-- ────────────────────────────────────────────────────────────────
-- Section: Dish allergens (link dishes to standard allergens)
-- Uses subqueries to get allergen IDs from migration-seeded data
-- ────────────────────────────────────────────────────────────────

-- Tagine Poulet: dairy (butter in sauce)
INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT '94ac4e49-3750-455a-ac96-526573fd666c', id, 'contains'
FROM public.allergens WHERE name = 'Dairy' AND is_custom = false
ON CONFLICT DO NOTHING;

-- Tagine Agneau Pruneaux: dairy, nuts (almonds)
INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT '201a1d71-c828-4b86-b312-c8b198cb1efd', id, 'contains'
FROM public.allergens WHERE name = 'Dairy' AND is_custom = false
ON CONFLICT DO NOTHING;

INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT '201a1d71-c828-4b86-b312-c8b198cb1efd', id, 'contains'
FROM public.allergens WHERE name = 'Tree Nuts' AND is_custom = false
ON CONFLICT DO NOTHING;

-- Couscous Royal: gluten (semolina), eggs (merguez)
INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT 'cd98ede6-3544-49c2-93c2-54a5e62709bd', id, 'contains'
FROM public.allergens WHERE name = 'Gluten' AND is_custom = false
ON CONFLICT DO NOTHING;

-- Cornes de Gazelle: nuts (almonds), gluten
INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT 'cea72e87-492c-437b-9eb1-5a08c0c1381d', id, 'contains'
FROM public.allergens WHERE name = 'Tree Nuts' AND is_custom = false
ON CONFLICT DO NOTHING;

INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT 'cea72e87-492c-437b-9eb1-5a08c0c1381d', id, 'contains'
FROM public.allergens WHERE name = 'Gluten' AND is_custom = false
ON CONFLICT DO NOTHING;

-- Baghrir: gluten, eggs
INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT '69d2c84f-3056-4e0b-b130-df33a5d6f18f', id, 'contains'
FROM public.allergens WHERE name = 'Gluten' AND is_custom = false
ON CONFLICT DO NOTHING;

INSERT INTO "public"."dish_allergens" ("dish_id", "allergen_id", "severity")
SELECT '69d2c84f-3056-4e0b-b130-df33a5d6f18f', id, 'contains'
FROM public.allergens WHERE name = 'Eggs' AND is_custom = false
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Special hours (holidays)
-- ────────────────────────────────────────────────────────────────

INSERT INTO "public"."special_hours" ("id", "location_id", "date", "open_time", "close_time", "is_closed", "reason") VALUES
	-- Eid al-Fitr (example date)
	('0e0e0e0e-0e0e-4e0e-8e0e-0e0e0e0e0e01', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '2026-03-30', NULL, NULL, true, 'Eid al-Fitr'),
	('0e0e0e0e-0e0e-4e0e-8e0e-0e0e0e0e0e02', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '2026-03-30', NULL, NULL, true, 'Eid al-Fitr'),
	-- Throne Day (July 30)
	('0e0e0e0e-0e0e-4e0e-8e0e-0e0e0e0e0e03', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '2026-07-30', '10:00:00', '20:00:00', false, 'Throne Day - Reduced hours')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- Section: Update owner profile with admin role
-- ────────────────────────────────────────────────────────────────

UPDATE "public"."profiles"
SET role = 'admin',
    full_name = 'Youssef El Mansouri',
    username = 'youssef_m'
WHERE id = '7042152a-7151-49f1-9bfd-3d8f156e7aef'
  AND full_name IS NULL;


-- ════════════════════════════════════════════════════════════════
-- DEMO RESTAURANT MENUS (10 restaurants across Morocco)
-- Each uses a different theme template and cuisine type.
-- All menus owned by seed user 7042152a-7151-49f1-9bfd-3d8f156e7aef
-- Prices in MAD centimes (5500 = 55.00 MAD)
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_user_id UUID := '7042152a-7151-49f1-9bfd-3d8f156e7aef';
  v_fr_lang UUID := 'ced37313-fc91-4c4d-a480-5d8081311a8e';

  -- Menu IDs
  m1 UUID := 'a1000001-0001-4000-8000-000000000001'; -- Dar Fassia, Marrakech
  m2 UUID := 'a1000001-0002-4000-8000-000000000002'; -- La Sqala, Casablanca
  m3 UUID := 'a1000001-0003-4000-8000-000000000003'; -- Le Port de Peche, Essaouira
  m4 UUID := 'a1000001-0004-4000-8000-000000000004'; -- Cafe Clock, Fes
  m5 UUID := 'a1000001-0005-4000-8000-000000000005'; -- Casa Jose, Tangier
  m6 UUID := 'a1000001-0006-4000-8000-000000000006'; -- Amlou, Agadir
  m7 UUID := 'a1000001-0007-4000-8000-000000000007'; -- Le Dhow, Rabat
  m8 UUID := 'a1000001-0008-4000-8000-000000000008'; -- Snack Chez Omar, Meknes
  m9 UUID := 'a1000001-0009-4000-8000-000000000009'; -- Chez Hicham Pizza, Casablanca
  m10 UUID := 'a1000001-0010-4000-8000-000000000010'; -- Bab Ssour, Chefchaouen

  -- Category IDs
  c11 UUID := 'c1000001-0101-4000-8000-000000000001';
  c12 UUID := 'c1000001-0102-4000-8000-000000000002';
  c13 UUID := 'c1000001-0103-4000-8000-000000000003';
  c14 UUID := 'c1000001-0104-4000-8000-000000000004';
  c21 UUID := 'c1000001-0201-4000-8000-000000000001';
  c22 UUID := 'c1000001-0202-4000-8000-000000000002';
  c23 UUID := 'c1000001-0203-4000-8000-000000000003';
  c31 UUID := 'c1000001-0301-4000-8000-000000000001';
  c32 UUID := 'c1000001-0302-4000-8000-000000000002';
  c33 UUID := 'c1000001-0303-4000-8000-000000000003';
  c41 UUID := 'c1000001-0401-4000-8000-000000000001';
  c42 UUID := 'c1000001-0402-4000-8000-000000000002';
  c43 UUID := 'c1000001-0403-4000-8000-000000000003';
  c51 UUID := 'c1000001-0501-4000-8000-000000000001';
  c52 UUID := 'c1000001-0502-4000-8000-000000000002';
  c53 UUID := 'c1000001-0503-4000-8000-000000000003';
  c61 UUID := 'c1000001-0601-4000-8000-000000000001';
  c62 UUID := 'c1000001-0602-4000-8000-000000000002';
  c63 UUID := 'c1000001-0603-4000-8000-000000000003';
  c71 UUID := 'c1000001-0701-4000-8000-000000000001';
  c72 UUID := 'c1000001-0702-4000-8000-000000000002';
  c73 UUID := 'c1000001-0703-4000-8000-000000000003';
  c74 UUID := 'c1000001-0704-4000-8000-000000000004';
  c81 UUID := 'c1000001-0801-4000-8000-000000000001';
  c82 UUID := 'c1000001-0802-4000-8000-000000000002';
  c83 UUID := 'c1000001-0803-4000-8000-000000000003';
  c91 UUID := 'c1000001-0901-4000-8000-000000000001';
  c92 UUID := 'c1000001-0902-4000-8000-000000000002';
  c93 UUID := 'c1000001-0903-4000-8000-000000000003';
  c101 UUID := 'c1000001-1001-4000-8000-000000000001';
  c102 UUID := 'c1000001-1002-4000-8000-000000000002';
  c103 UUID := 'c1000001-1003-4000-8000-000000000003';

BEGIN

-- ── MENUS ──────────────────────────────────────────────────────

INSERT INTO public.menus (id, name, user_id, slug, city, address, is_published, contact_number, currency, price_range, rating, review_count, view_count, is_featured, phone, whatsapp_number, restaurant_lat, restaurant_lng, enabled_order_types, delivery_fee, min_order_amount, estimated_prep_time, city_id, cuisine_type_id) VALUES
  (m1, 'Dar Fassia', v_user_id, 'dar-fassia-marrakech-100001', 'Marrakech', '55 Boulevard Zerktouni, Gueliz', true, '+212524433600', 'MAD', 3, 4.7, 234, 5800, true, '+212524433600', '+212661234501', 31.6340, -8.0100, ARRAY['dine_in'], 0, 0, 25,
   (SELECT id FROM public.cities WHERE slug = 'marrakech'), (SELECT id FROM public.cuisine_types WHERE slug = 'moroccan')),
  (m2, 'La Sqala', v_user_id, 'la-sqala-casablanca-100002', 'Casablanca', 'Boulevard des Almohades, Ancienne Medina', true, '+212522260960', 'MAD', 2, 4.5, 412, 8200, true, '+212522260960', '+212661234502', 33.6010, -7.6185, ARRAY['dine_in'], 0, 0, 20,
   (SELECT id FROM public.cities WHERE slug = 'casablanca'), (SELECT id FROM public.cuisine_types WHERE slug = 'moroccan')),
  (m3, 'Le Port de Peche', v_user_id, 'le-port-de-peche-essaouira-100003', 'Essaouira', 'Port de Peche, Essaouira Medina', true, '+212524476166', 'MAD', 2, 4.6, 387, 6300, true, '+212524476166', '+212661234503', 31.5120, -9.7710, ARRAY['dine_in'], 0, 0, 20,
   (SELECT id FROM public.cities WHERE slug = 'essaouira'), (SELECT id FROM public.cuisine_types WHERE slug = 'seafood')),
  (m4, 'Cafe Clock', v_user_id, 'cafe-clock-fes-100004', 'Fes', '7 Derb el Magana, Talaa Kbira, Fes Medina', true, '+212535637855', 'MAD', 2, 4.4, 523, 9100, true, '+212535637855', '+212661234504', 34.0628, -4.9736, ARRAY['dine_in','pickup'], 0, 3000, 15,
   (SELECT id FROM public.cities WHERE slug = 'fes'), (SELECT id FROM public.cuisine_types WHERE slug = 'international')),
  (m5, 'Casa Jose', v_user_id, 'casa-jose-tangier-100005', 'Tangier', '1 Rue de la Plage, Tangier Ville', true, '+212539331413', 'MAD', 2, 4.3, 198, 3400, false, '+212539331413', '+212661234505', 35.7850, -5.8130, ARRAY['dine_in','pickup'], 0, 0, 20,
   (SELECT id FROM public.cities WHERE slug = 'tangier'), (SELECT id FROM public.cuisine_types WHERE slug = 'grill-bbq')),
  (m6, 'Amlou Surf Cafe', v_user_id, 'amlou-surf-cafe-agadir-100006', 'Agadir', 'Plage Taghazout, Route Nationale 1', true, '+212528200145', 'MAD', 1, 4.2, 167, 2800, false, '+212528200145', '+212661234506', 30.5420, -9.7085, ARRAY['dine_in','pickup','delivery'], 1500, 5000, 15,
   (SELECT id FROM public.cities WHERE slug = 'agadir'), (SELECT id FROM public.cuisine_types WHERE slug = 'cafe-bakery')),
  (m7, 'Le Dhow', v_user_id, 'le-dhow-rabat-100007', 'Rabat', 'Quai de la Tour Hassan, Bou Regreg Marina', true, '+212537729028', 'MAD', 3, 4.8, 145, 4200, true, '+212537729028', '+212661234507', 34.0249, -6.8362, ARRAY['dine_in'], 0, 0, 30,
   (SELECT id FROM public.cities WHERE slug = 'rabat'), (SELECT id FROM public.cuisine_types WHERE slug = 'french')),
  (m8, 'Snack Chez Omar', v_user_id, 'snack-chez-omar-meknes-100008', 'Meknes', 'Place El Hedim, Meknes Medina', true, '+212535530217', 'MAD', 1, 4.1, 312, 7600, false, '+212535530217', '+212661234508', 33.8930, -5.5540, ARRAY['dine_in','pickup','delivery'], 1000, 3000, 10,
   (SELECT id FROM public.cities WHERE slug = 'meknes'), (SELECT id FROM public.cuisine_types WHERE slug = 'street-food')),
  (m9, 'Chez Hicham Pizza', v_user_id, 'chez-hicham-pizza-casablanca-100009', 'Casablanca', '45 Rue Tarik Ibn Ziad, Maarif', true, '+212522251890', 'MAD', 2, 4.3, 278, 5100, false, '+212522251890', '+212661234509', 33.5780, -7.6350, ARRAY['dine_in','pickup','delivery'], 1500, 5000, 20,
   (SELECT id FROM public.cities WHERE slug = 'casablanca'), (SELECT id FROM public.cuisine_types WHERE slug = 'pizza-pasta')),
  (m10, 'Bab Ssour', v_user_id, 'bab-ssour-chefchaouen-100010', 'Chefchaouen', 'Place Outa El Hammam, Chefchaouen Medina', true, '+212539986102', 'MAD', 1, 4.5, 203, 4500, true, '+212539986102', '+212661234510', 35.1710, -5.2636, ARRAY['dine_in','pickup'], 0, 0, 15,
   (SELECT id FROM public.cities WHERE slug = 'chefchaouen'), (SELECT id FROM public.cuisine_types WHERE slug = 'moroccan'))
ON CONFLICT DO NOTHING;

-- ── MENU LANGUAGES (French) ────────────────────────────────────

INSERT INTO public.menu_languages (menu_id, language_id, is_default) VALUES
  (m1, v_fr_lang, true), (m2, v_fr_lang, true), (m3, v_fr_lang, true),
  (m4, v_fr_lang, true), (m5, v_fr_lang, true), (m6, v_fr_lang, true),
  (m7, v_fr_lang, true), (m8, v_fr_lang, true), (m9, v_fr_lang, true),
  (m10, v_fr_lang, true)
ON CONFLICT DO NOTHING;

-- ── CATEGORIES ─────────────────────────────────────────────────

INSERT INTO public.categories (id, menu_id, created_at) VALUES
  (c11, m1, NOW()), (c12, m1, NOW()), (c13, m1, NOW()), (c14, m1, NOW()),
  (c21, m2, NOW()), (c22, m2, NOW()), (c23, m2, NOW()),
  (c31, m3, NOW()), (c32, m3, NOW()), (c33, m3, NOW()),
  (c41, m4, NOW()), (c42, m4, NOW()), (c43, m4, NOW()),
  (c51, m5, NOW()), (c52, m5, NOW()), (c53, m5, NOW()),
  (c61, m6, NOW()), (c62, m6, NOW()), (c63, m6, NOW()),
  (c71, m7, NOW()), (c72, m7, NOW()), (c73, m7, NOW()), (c74, m7, NOW()),
  (c81, m8, NOW()), (c82, m8, NOW()), (c83, m8, NOW()),
  (c91, m9, NOW()), (c92, m9, NOW()), (c93, m9, NOW()),
  (c101, m10, NOW()), (c102, m10, NOW()), (c103, m10, NOW())
ON CONFLICT DO NOTHING;

-- ── CATEGORY TRANSLATIONS ──────────────────────────────────────

INSERT INTO public.categories_translation (category_id, name, language_id) VALUES
  (c11, 'Entrees', v_fr_lang), (c12, 'Tagines', v_fr_lang),
  (c13, 'Couscous', v_fr_lang), (c14, 'Desserts', v_fr_lang),
  (c21, 'Petit Dejeuner', v_fr_lang), (c22, 'Plats Principaux', v_fr_lang),
  (c23, 'Boissons', v_fr_lang),
  (c31, 'Poissons Grilles', v_fr_lang), (c32, 'Fruits de Mer', v_fr_lang),
  (c33, 'Accompagnements', v_fr_lang),
  (c41, 'Sandwiches', v_fr_lang), (c42, 'Plats du Monde', v_fr_lang),
  (c43, 'Smoothies & Jus', v_fr_lang),
  (c51, 'Tapas', v_fr_lang), (c52, 'Grillades', v_fr_lang),
  (c53, 'Desserts', v_fr_lang),
  (c61, 'Bowls & Salades', v_fr_lang), (c62, 'Crepes & Pancakes', v_fr_lang),
  (c63, 'Boissons Fraiches', v_fr_lang),
  (c71, 'Amuse-Bouches', v_fr_lang), (c72, 'Poissons & Viandes', v_fr_lang),
  (c73, 'Fromages', v_fr_lang), (c74, 'Desserts Raffines', v_fr_lang),
  (c81, 'Sandwiches & Bocadillos', v_fr_lang), (c82, 'Plats Rapides', v_fr_lang),
  (c83, 'Jus & Boissons', v_fr_lang),
  (c91, 'Pizzas Classiques', v_fr_lang), (c92, 'Pizzas Marocaines', v_fr_lang),
  (c93, 'Accompagnements', v_fr_lang),
  (c101, 'Soupes & Salades', v_fr_lang), (c102, 'Plats Traditionnels', v_fr_lang),
  (c103, 'Patisseries & The', v_fr_lang)
ON CONFLICT DO NOTHING;

-- ── DISHES (6 per restaurant = 60 total) ───────────────────────

INSERT INTO public.dishes (id, price, menu_id, category_id, created_at, calories) VALUES
  -- Dar Fassia (Marrakech)
  ('d1000001-0101-4000-8000-000000000001', 4500, m1, c11, NOW(), 180),
  ('d1000001-0102-4000-8000-000000000002', 3500, m1, c11, NOW(), 120),
  ('d1000001-0103-4000-8000-000000000003', 8500, m1, c12, NOW(), 520),
  ('d1000001-0104-4000-8000-000000000004', 7500, m1, c12, NOW(), 420),
  ('d1000001-0105-4000-8000-000000000005', 9500, m1, c13, NOW(), 650),
  ('d1000001-0106-4000-8000-000000000006', 4000, m1, c14, NOW(), 280),
  -- La Sqala (Casablanca)
  ('d1000001-0201-4000-8000-000000000001', 4500, m2, c21, NOW(), 350),
  ('d1000001-0202-4000-8000-000000000002', 3000, m2, c21, NOW(), 220),
  ('d1000001-0203-4000-8000-000000000003', 6500, m2, c22, NOW(), 480),
  ('d1000001-0204-4000-8000-000000000004', 7000, m2, c22, NOW(), 510),
  ('d1000001-0205-4000-8000-000000000005', 2000, m2, c23, NOW(), 5),
  ('d1000001-0206-4000-8000-000000000006', 2500, m2, c23, NOW(), 90),
  -- Le Port de Peche (Essaouira)
  ('d1000001-0301-4000-8000-000000000001', 7500, m3, c31, NOW(), 320),
  ('d1000001-0302-4000-8000-000000000002', 8500, m3, c31, NOW(), 380),
  ('d1000001-0303-4000-8000-000000000003', 12000, m3, c32, NOW(), 280),
  ('d1000001-0304-4000-8000-000000000004', 9500, m3, c32, NOW(), 350),
  ('d1000001-0305-4000-8000-000000000005', 2500, m3, c33, NOW(), 150),
  ('d1000001-0306-4000-8000-000000000006', 2000, m3, c33, NOW(), 180),
  -- Cafe Clock (Fes)
  ('d1000001-0401-4000-8000-000000000001', 5500, m4, c41, NOW(), 450),
  ('d1000001-0402-4000-8000-000000000002', 4500, m4, c41, NOW(), 380),
  ('d1000001-0403-4000-8000-000000000003', 6500, m4, c42, NOW(), 520),
  ('d1000001-0404-4000-8000-000000000004', 7000, m4, c42, NOW(), 480),
  ('d1000001-0405-4000-8000-000000000005', 3500, m4, c43, NOW(), 180),
  ('d1000001-0406-4000-8000-000000000006', 2500, m4, c43, NOW(), 120),
  -- Casa Jose (Tangier)
  ('d1000001-0501-4000-8000-000000000001', 4000, m5, c51, NOW(), 200),
  ('d1000001-0502-4000-8000-000000000002', 3500, m5, c51, NOW(), 180),
  ('d1000001-0503-4000-8000-000000000003', 8500, m5, c52, NOW(), 580),
  ('d1000001-0504-4000-8000-000000000004', 7500, m5, c52, NOW(), 420),
  ('d1000001-0505-4000-8000-000000000005', 3500, m5, c53, NOW(), 320),
  -- Amlou Surf Cafe (Agadir)
  ('d1000001-0601-4000-8000-000000000001', 5500, m6, c61, NOW(), 380),
  ('d1000001-0602-4000-8000-000000000002', 4500, m6, c61, NOW(), 320),
  ('d1000001-0603-4000-8000-000000000003', 3500, m6, c62, NOW(), 420),
  ('d1000001-0604-4000-8000-000000000004', 4000, m6, c62, NOW(), 380),
  ('d1000001-0605-4000-8000-000000000005', 3000, m6, c63, NOW(), 150),
  ('d1000001-0606-4000-8000-000000000006', 2500, m6, c63, NOW(), 90),
  -- Le Dhow (Rabat)
  ('d1000001-0701-4000-8000-000000000001', 8500, m7, c71, NOW(), 200),
  ('d1000001-0702-4000-8000-000000000002', 7000, m7, c71, NOW(), 150),
  ('d1000001-0703-4000-8000-000000000003', 16000, m7, c72, NOW(), 480),
  ('d1000001-0704-4000-8000-000000000004', 14000, m7, c72, NOW(), 380),
  ('d1000001-0705-4000-8000-000000000005', 6000, m7, c73, NOW(), 280),
  ('d1000001-0706-4000-8000-000000000006', 7500, m7, c74, NOW(), 320),
  -- Snack Chez Omar (Meknes)
  ('d1000001-0801-4000-8000-000000000001', 2500, m8, c81, NOW(), 480),
  ('d1000001-0802-4000-8000-000000000002', 2000, m8, c81, NOW(), 420),
  ('d1000001-0803-4000-8000-000000000003', 3500, m8, c82, NOW(), 520),
  ('d1000001-0804-4000-8000-000000000004', 3000, m8, c82, NOW(), 380),
  ('d1000001-0805-4000-8000-000000000005', 1500, m8, c83, NOW(), 120),
  ('d1000001-0806-4000-8000-000000000006', 1000, m8, c83, NOW(), 5),
  -- Chez Hicham Pizza (Casablanca)
  ('d1000001-0901-4000-8000-000000000001', 5500, m9, c91, NOW(), 720),
  ('d1000001-0902-4000-8000-000000000002', 7000, m9, c91, NOW(), 850),
  ('d1000001-0903-4000-8000-000000000003', 6500, m9, c92, NOW(), 780),
  ('d1000001-0904-4000-8000-000000000004', 7500, m9, c92, NOW(), 820),
  ('d1000001-0905-4000-8000-000000000005', 2500, m9, c93, NOW(), 350),
  ('d1000001-0906-4000-8000-000000000006', 2000, m9, c93, NOW(), 80),
  -- Bab Ssour (Chefchaouen)
  ('d1000001-1001-4000-8000-000000000001', 2500, m10, c101, NOW(), 180),
  ('d1000001-1002-4000-8000-000000000002', 3000, m10, c101, NOW(), 220),
  ('d1000001-1003-4000-8000-000000000003', 5500, m10, c102, NOW(), 480),
  ('d1000001-1004-4000-8000-000000000004', 6000, m10, c102, NOW(), 520),
  ('d1000001-1005-4000-8000-000000000005', 2000, m10, c103, NOW(), 280),
  ('d1000001-1006-4000-8000-000000000006', 1500, m10, c103, NOW(), 5)
ON CONFLICT DO NOTHING;

-- ── DISH TRANSLATIONS (French) ─────────────────────────────────

INSERT INTO public.dishes_translation (dish_id, language_id, name, description) VALUES
  -- Dar Fassia
  ('d1000001-0101-4000-8000-000000000001', v_fr_lang, 'Briouates aux Amandes', 'Feuilletes croustillants farcis aux amandes et miel'),
  ('d1000001-0102-4000-8000-000000000002', v_fr_lang, 'Zaalouk', 'Salade d''aubergines grillees aux tomates et epices'),
  ('d1000001-0103-4000-8000-000000000003', v_fr_lang, 'Tagine Agneau aux Pruneaux', 'Agneau mijote avec pruneaux, amandes grillees et cannelle'),
  ('d1000001-0104-4000-8000-000000000004', v_fr_lang, 'Tagine Poulet Citron Confit', 'Poulet aux citrons confits et olives vertes'),
  ('d1000001-0105-4000-8000-000000000005', v_fr_lang, 'Couscous Royal Sept Legumes', 'Semoule fine aux sept legumes, agneau, poulet et merguez'),
  ('d1000001-0106-4000-8000-000000000006', v_fr_lang, 'Pastilla au Lait', 'Feuilles de brick au lait parfume a la fleur d''oranger'),
  -- La Sqala
  ('d1000001-0201-4000-8000-000000000001', v_fr_lang, 'Msemen au Beurre et Miel', 'Crepe feuilletee traditionnelle servie avec beurre et miel'),
  ('d1000001-0202-4000-8000-000000000002', v_fr_lang, 'Baghrir au Miel', 'Crepe mille trous nappee de miel et beurre fondu'),
  ('d1000001-0203-4000-8000-000000000003', v_fr_lang, 'Tagine Kefta aux Oeufs', 'Boulettes de boeuf epicees dans sauce tomate avec oeufs poches'),
  ('d1000001-0204-4000-8000-000000000004', v_fr_lang, 'Pastilla au Pigeon', 'Tourte croustillante au pigeon, amandes et cannelle'),
  ('d1000001-0205-4000-8000-000000000005', v_fr_lang, 'The a la Menthe', 'The vert gunpowder a la menthe fraiche, servi traditionnel'),
  ('d1000001-0206-4000-8000-000000000006', v_fr_lang, 'Jus d''Orange Presse', 'Oranges fraiches pressees a la commande'),
  -- Le Port de Peche
  ('d1000001-0301-4000-8000-000000000001', v_fr_lang, 'Daurade Royale Grillee', 'Daurade entiere grillee aux herbes, citron et huile d''olive'),
  ('d1000001-0302-4000-8000-000000000002', v_fr_lang, 'Loup de Mer au Four', 'Bar entier roti au four avec legumes de saison'),
  ('d1000001-0303-4000-8000-000000000003', v_fr_lang, 'Plateau Fruits de Mer', 'Crevettes, calamars, moules, palourdes et langoustines'),
  ('d1000001-0304-4000-8000-000000000004', v_fr_lang, 'Crevettes Royales a l''Ail', 'Grosses crevettes sautees a l''ail, piment et persil'),
  ('d1000001-0305-4000-8000-000000000005', v_fr_lang, 'Riz Safrane', 'Riz basmati parfume au safran de Taliouine'),
  ('d1000001-0306-4000-8000-000000000006', v_fr_lang, 'Salade Marocaine', 'Tomates, concombres, oignons, persil et huile d''olive'),
  -- Cafe Clock
  ('d1000001-0401-4000-8000-000000000001', v_fr_lang, 'Camel Burger', 'Le fameux burger de chameau grille avec harissa maison'),
  ('d1000001-0402-4000-8000-000000000002', v_fr_lang, 'Falafel Wrap', 'Falafels croustillants avec houmous et legumes frais'),
  ('d1000001-0403-4000-8000-000000000003', v_fr_lang, 'Lamb Tagine Clock Style', 'Tagine d''agneau revisite avec abricots et noix de cajou'),
  ('d1000001-0404-4000-8000-000000000004', v_fr_lang, 'Chicken Bastilla', 'Pastilla au poulet facon Cafe Clock'),
  ('d1000001-0405-4000-8000-000000000005', v_fr_lang, 'Smoothie Avocat & Dattes', 'Avocat frais mixe avec dattes Medjool et lait d''amande'),
  ('d1000001-0406-4000-8000-000000000006', v_fr_lang, 'Jus Carotte Gingembre', 'Carottes fraiches, gingembre et citron presses'),
  -- Casa Jose
  ('d1000001-0501-4000-8000-000000000001', v_fr_lang, 'Croquetas de Jamon', 'Croquettes croustillantes au jambon iberique'),
  ('d1000001-0502-4000-8000-000000000002', v_fr_lang, 'Gambas al Ajillo', 'Crevettes sautees a l''ail, piment et huile d''olive'),
  ('d1000001-0503-4000-8000-000000000003', v_fr_lang, 'Entrecote Grillee', 'Entrecote de boeuf grillee au charbon avec pommes sarladaises'),
  ('d1000001-0504-4000-8000-000000000004', v_fr_lang, 'Brochettes Mixtes Casa Jose', 'Assortiment boeuf, poulet et merguez grilles au charbon'),
  ('d1000001-0505-4000-8000-000000000005', v_fr_lang, 'Crema Catalana', 'Creme brulee a l''espagnole, parfumee au citron et cannelle'),
  -- Amlou Surf Cafe
  ('d1000001-0601-4000-8000-000000000001', v_fr_lang, 'Acai Bowl Surfeur', 'Acai bio, granola, banane, fruits rouges et graines de chia'),
  ('d1000001-0602-4000-8000-000000000002', v_fr_lang, 'Salade Quinoa Avocat', 'Quinoa, avocat, grenade, menthe et vinaigrette au citron'),
  ('d1000001-0603-4000-8000-000000000003', v_fr_lang, 'Crepe Amlou et Miel', 'Crepe artisanale garnie d''amlou (pate d''amande a l''huile d''argan)'),
  ('d1000001-0604-4000-8000-000000000004', v_fr_lang, 'Pancakes Banane Argan', 'Pancakes moelleux a la banane, huile d''argan et miel'),
  ('d1000001-0605-4000-8000-000000000005', v_fr_lang, 'Smoothie Mangue Passion', 'Mangue fraiche, fruit de la passion et lait de coco'),
  ('d1000001-0606-4000-8000-000000000006', v_fr_lang, 'Jus Detox Vert', 'Epinards, concombre, pomme verte, gingembre et citron'),
  -- Le Dhow
  ('d1000001-0701-4000-8000-000000000001', v_fr_lang, 'Foie Gras Maison', 'Foie gras mi-cuit, chutney de figues et brioche toastee'),
  ('d1000001-0702-4000-8000-000000000002', v_fr_lang, 'Carpaccio de Saint-Jacques', 'Noix de Saint-Jacques tranchees fines, agrumes et huile de truffe'),
  ('d1000001-0703-4000-8000-000000000003', v_fr_lang, 'Filet de Boeuf Truffe', 'Filet de boeuf AAA, jus truffe, puree de celeri et legumes rotis'),
  ('d1000001-0704-4000-8000-000000000004', v_fr_lang, 'Bar en Croute de Sel', 'Bar entier cuit en croute de sel, beurre blanc au safran'),
  ('d1000001-0705-4000-8000-000000000005', v_fr_lang, 'Assiette de Fromages Affines', 'Selection de 5 fromages affines, confiture et noix'),
  ('d1000001-0706-4000-8000-000000000006', v_fr_lang, 'Fondant au Chocolat Valrhona', 'Coeur coulant au chocolat noir, glace vanille de Madagascar'),
  -- Snack Chez Omar
  ('d1000001-0801-4000-8000-000000000001', v_fr_lang, 'Bocadillo Kefta', 'Pain grille farci de kefta epicee, salade et sauce piquante'),
  ('d1000001-0802-4000-8000-000000000002', v_fr_lang, 'Sandwich Poulet Charmoula', 'Poulet marine charmoula dans pain maison, crudites'),
  ('d1000001-0803-4000-8000-000000000003', v_fr_lang, 'Brochettes Mixtes Omar', 'Brochettes de kefta et poulet grillees, frites et salade'),
  ('d1000001-0804-4000-8000-000000000004', v_fr_lang, 'Tajine Express Kefta', 'Kefta aux oeufs en tajine individuel, pain frais'),
  ('d1000001-0805-4000-8000-000000000005', v_fr_lang, 'Jus d''Orange Presse', 'Oranges fraiches de la region pressees a la commande'),
  ('d1000001-0806-4000-8000-000000000006', v_fr_lang, 'The a la Menthe', 'The vert a la menthe fraiche, tradition meknassie'),
  -- Chez Hicham Pizza
  ('d1000001-0901-4000-8000-000000000001', v_fr_lang, 'Pizza Margherita', 'Sauce tomate, mozzarella, basilic frais'),
  ('d1000001-0902-4000-8000-000000000002', v_fr_lang, 'Pizza Quatre Fromages', 'Mozzarella, gorgonzola, chevre et emmental'),
  ('d1000001-0903-4000-8000-000000000003', v_fr_lang, 'Pizza Kefta Merguez', 'Sauce tomate, kefta epicee, merguez, oignons et poivrons'),
  ('d1000001-0904-4000-8000-000000000004', v_fr_lang, 'Pizza Pastilla', 'Poulet effiloche, amandes, cannelle, oeuf et feuille de brick croustillante'),
  ('d1000001-0905-4000-8000-000000000005', v_fr_lang, 'Frites Maison', 'Frites de pommes de terre fraiches, sel et epices'),
  ('d1000001-0906-4000-8000-000000000006', v_fr_lang, 'Coca-Cola', 'Coca-Cola 33cl bien fraiche'),
  -- Bab Ssour
  ('d1000001-1001-4000-8000-000000000001', v_fr_lang, 'Harira Chefchaouen', 'Soupe traditionnelle aux lentilles, pois chiches et coriandre fraiche'),
  ('d1000001-1002-4000-8000-000000000002', v_fr_lang, 'Salade Mechouia', 'Poivrons et tomates grilles au charbon, ail et cumin'),
  ('d1000001-1003-4000-8000-000000000003', v_fr_lang, 'Tagine de Chevre aux Figues', 'Chevre de montagne mijote avec figues seches et miel'),
  ('d1000001-1004-4000-8000-000000000004', v_fr_lang, 'Rfissa Traditionnelle', 'Msemen emiette, lentilles, poulet et bouillon parfume au fenugrec'),
  ('d1000001-1005-4000-8000-000000000005', v_fr_lang, 'Cornes de Gazelle', 'Patisserie aux amandes en forme de croissant, fleur d''oranger'),
  ('d1000001-1006-4000-8000-000000000006', v_fr_lang, 'The a la Menthe de Chefchaouen', 'The vert a la menthe des montagnes du Rif')
ON CONFLICT DO NOTHING;

-- ── MENU THEMES (10 different templates) ───────────────────────

INSERT INTO public.menu_themes (menu_id, primary_color, secondary_color, background_color, surface_color, text_color, accent_color, heading_font, body_font, font_size, layout_style, card_style, border_radius, spacing, show_images, image_style, show_prices, show_nutrition, show_category_nav, show_category_dividers, header_style) VALUES
  -- Dar Fassia → zellige-mosaic
  (m1, '#0D9488', '#C2703E', '#0F172A', '#1E293B', '#F0FDFA', '#F59E0B', 'Cormorant', 'Raleway', 'medium', 'elegant', 'glass', 'medium', 'comfortable', true, 'rounded', true, true, true, true, 'overlay'),
  -- La Sqala → terracotta
  (m2, '#C2703E', '#8B4513', '#FFF8F0', '#FFF1E6', '#3D2B1F', '#D4A574', 'Playfair Display', 'Lato', 'medium', 'classic', 'elevated', 'medium', 'comfortable', true, 'rounded', true, false, true, true, 'banner'),
  -- Le Port de Peche → ocean-breeze
  (m3, '#0EA5E9', '#0284C7', '#F0F9FF', '#FFFFFF', '#0C4A6E', '#F97316', 'Montserrat', 'Source Sans 3', 'medium', 'modern', 'elevated', 'large', 'comfortable', true, 'rounded', true, false, true, true, 'banner'),
  -- Cafe Clock → medina-blue
  (m4, '#1D4ED8', '#1E40AF', '#EFF6FF', '#FFFFFF', '#1E3A5F', '#C2703E', 'Playfair Display', 'Lato', 'medium', 'classic', 'elevated', 'medium', 'comfortable', true, 'rounded', true, false, true, true, 'banner'),
  -- Casa Jose → ember-grill
  (m5, '#DC2626', '#991B1B', '#1C1917', '#292524', '#FEF2F2', '#F59E0B', 'DM Sans', 'Inter', 'medium', 'modern', 'glass', 'medium', 'comfortable', true, 'rounded', true, false, true, true, 'overlay'),
  -- Amlou → sahara-sand
  (m6, '#D4A574', '#B8860B', '#FEF7EE', '#FFFBF5', '#3D2B1F', '#C2703E', 'Lora', 'Source Sans 3', 'medium', 'magazine', 'flat', 'small', 'spacious', true, 'rounded', true, false, true, true, 'centered'),
  -- Le Dhow → champagne-gold
  (m7, '#B8860B', '#8B6914', '#FFFDF7', '#FFFEF5', '#1A1A1A', '#7C2D12', 'Cormorant', 'EB Garamond', 'medium', 'magazine', 'flat', 'small', 'spacious', true, 'rounded', true, true, true, true, 'centered'),
  -- Snack Chez Omar → street-eats
  (m8, '#EA580C', '#C2410C', '#FEF9C3', '#FFFFFF', '#1C1917', '#7C3AED', 'Montserrat', 'Poppins', 'medium', 'modern', 'elevated', 'large', 'compact', true, 'rounded', true, false, true, true, 'banner'),
  -- Chez Hicham Pizza → pizza-night
  (m9, '#DC2626', '#16A34A', '#FEF2F2', '#FFFFFF', '#1C1917', '#F59E0B', 'Montserrat', 'Lato', 'medium', 'grid', 'elevated', 'medium', 'comfortable', true, 'rounded', true, false, true, true, 'banner'),
  -- Bab Ssour → mint-tea
  (m10, '#15803D', '#166534', '#F0FDF4', '#FFFFFF', '#14532D', '#B8860B', 'Playfair Display', 'Nunito', 'medium', 'classic', 'bordered', 'medium', 'comfortable', true, 'rounded', true, false, true, true, 'banner')
ON CONFLICT DO NOTHING;

END $$;
