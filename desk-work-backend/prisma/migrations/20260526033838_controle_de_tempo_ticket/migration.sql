-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A_FAZER',
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    "dataConclusao" DATETIME,
    "empresaId" TEXT NOT NULL,
    "dispositivoId" TEXT,
    "tempoIniciadoEm" DATETIME,
    "totalSegundos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tickets_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tickets_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tickets" ("assunto", "dataAtualizacao", "dataConclusao", "dataCriacao", "descricao", "dispositivoId", "empresaId", "id", "numero", "status") SELECT "assunto", "dataAtualizacao", "dataConclusao", "dataCriacao", "descricao", "dispositivoId", "empresaId", "id", "numero", "status" FROM "tickets";
DROP TABLE "tickets";
ALTER TABLE "new_tickets" RENAME TO "tickets";
CREATE UNIQUE INDEX "tickets_numero_key" ON "tickets"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
