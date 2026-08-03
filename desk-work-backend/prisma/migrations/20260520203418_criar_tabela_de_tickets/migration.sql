-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "dispositivo" TEXT,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A_FAZER',
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" DATETIME NOT NULL,
    "dataConclusao" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numero_key" ON "tickets"("numero");
