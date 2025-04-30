import { Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
  imports: [ConfigModule],
})
export class FirebaseModule {}
