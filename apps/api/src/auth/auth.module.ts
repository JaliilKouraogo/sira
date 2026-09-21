import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard, RolesGuard } from "./auth.guards";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { TokensService } from "./tokens.service";

@Module({
  // Secret et durée sont passés à chaque signature, depuis la configuration validée.
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokensService, JwtAuthGuard, RolesGuard],
  exports: [TokensService, PasswordService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
