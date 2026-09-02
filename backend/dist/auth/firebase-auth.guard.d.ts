import { CanActivate, ExecutionContext } from "@nestjs/common";
import { FirebaseAdminService } from "../firebase/firebase.module";
export declare class FirebaseAuthGuard implements CanActivate {
    private readonly firebase;
    private readonly logger;
    constructor(firebase: FirebaseAdminService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
