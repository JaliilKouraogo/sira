import { Injectable } from "@nestjs/common";
import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id (section 11.1 du plan), algorithme par défaut de la bibliothèque,
 * avec les paramètres minimaux recommandés par l'OWASP : 19 Mio de mémoire,
 * 2 passes, 1 fil.
 */
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

@Injectable()
export class PasswordService {
  /** Empreinte de comparaison quand le compte n'existe pas, pour un temps de réponse constant. */
  private dummy: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return hash(password, OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /**
   * Fait le même travail qu'une vraie vérification : un attaquant ne peut pas
   * deviner, au temps de réponse, si une adresse possède un compte.
   */
  async verifyAgainstDummy(password: string): Promise<false> {
    this.dummy ??= this.hash("sira-empreinte-de-comparaison");
    await this.verify(await this.dummy, password);
    return false;
  }
}
