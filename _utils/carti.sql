-- Curățare stare bază de date
drop type if exists tipuri_carti;
drop type if exists colectii_carte;
drop type if exists limba_carte;
drop table carti;

-- Definire tipuri enum
create type tipuri_carti as enum('ebook', 'audiobook', 'multimedia');
create type colectii_carte as enum('Literatură română', 'Literatură clasică', 'Literatură pentru copii', 'Fantasy', 'Science fiction', 'Thriller', 'Romance', 'Memorialistică');
create type limba_carte as enum('română', 'engleză', 'franceză', 'italiană', 'germană');

-- Creare tabelă cărți
create table if not exists carti (
	id serial primary key,
	isbn numeric(13, 0) unique not null,
	titlu varchar(100) unique not null,
	autor varchar(50) not null,
	editura varchar(50) not null,
	descriere text,
	imagine varchar(300),
	tip_carte tipuri_carti default 'ebook',
	colectie colectii_carte default 'Literatură clasică',
	limba limba_carte default 'română',
	format varchar [] not null,
	pret numeric(8,2) not null,
	nr_pagini int not null check (nr_pagini > 0), -- în cazul audiobook-urilor înseamnă numărul de minute de înregistrare
	anul_aparitiei numeric(4,0),
	data_adaugare timestamp default current_timestamp,
	oferta boolean not null default false
);

-- Adăugare informații
insert into carti (
	isbn, titlu, autor, editura, descriere, imagine, tip_carte, colectie, 
	limba, format, pret, nr_pagini, anul_aparitiei, oferta
) values
(9789737883469, 'Viața ca o pradă', 'Marin Preda', 'Cartex Serv', '', '', 'ebook', 'Literatură română', 'română', '{"bookland", "pdf"}', 40, 320, 2013, false),
(9786060861317, 'Harry Potter și piatra filosofală', 'J.K. Rowling', 'Arthur', '„Cartile Harry Potter au o calitate rar întâlnită: sunt adorate de părinți și de copii deopotrivă.“ Daily Telegraph', '', 'ebook', 'Fantasy', 'română', '{"bookland", "epub", "mobi"}', 32.5, 210, 2021, false),
(9780520946323, 'The Adventures of Tom Sawyer', 'Mark Twain', 'University of California Press', '', '', 'ebook', 'Literatură pentru copii', 'engleză', '{"bookland", "pdf", "epub"}', 29.5, 306, 2010, true),
(9786065903166, 'Inimă de samurai', 'Margi Preus', 'Booklet', '', '', 'audiobook', 'Literatură pentru copii', 'română', '{"bookland", "mp3"}', 21.5, 110, 2016, true),
(9781508212706, 'It ends with us', 'Colleen Hoover', 'Simson & Schuster Audio', '', '', 'audiobook', 'Romance', 'engleză', '{"bookland", "mp3"}', 37.5, 690, 2016, false);

-- Acordare privilegii user acces
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tudor;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tudor;
