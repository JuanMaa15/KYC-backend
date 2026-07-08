-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "urlDocumentImage" TEXT,
    "urlSelfieImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_verifications" ("createdAt", "documentNumber", "email", "id", "name", "status", "updatedAt", "urlDocumentImage", "urlSelfieImage") SELECT "createdAt", "documentNumber", "email", "id", "name", "status", "updatedAt", "urlDocumentImage", "urlSelfieImage" FROM "verifications";
DROP TABLE "verifications";
ALTER TABLE "new_verifications" RENAME TO "verifications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
