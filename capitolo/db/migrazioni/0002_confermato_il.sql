-- Migrazione 0002 — quando un dato è stato confermato da una persona.
--
-- Le pagine pubbliche (compito ⑥) mostrano la «data di ultima verifica» in
-- chiaro: serve sapere quando l'ultima conferma umana è avvenuta. La revisione
-- (compito ⑤) valorizza questo campo al momento della conferma.
--
-- Una migrazione applicata non si modifica: questa aggiunge, non tocca la 0001.

begin;

alter table scadenza add column confermato_il timestamptz;
alter table regola   add column confermato_il timestamptz;

commit;
