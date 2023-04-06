import Config from "./models/config";
import Part from "./models/part";
import Session from "./models/session";
import Sprint from "./models/sprint";
import User from "./models/user";

interface ADA_Config {
    SMTP_Host :Config;
    SMTP_User :Config;
    SMTP_Port :Config;
    SMTP_Password :Config;
    Default_Password :Config;
    Hostname :Config;
    UsingCustomGenerator: Config;
    UnderMaintenance: Config;
    ADAInstanceId: Config;
}

class ADA {
    public sprint: Sprint = null;
    public parts: Part[] = null;
    public sessions: Session[] = null;

    /*
    ** *WARNING*: Do not use users for anything else than getting a list and names of already existing users.
    ** This field only get updated when personnal informations (such as name) are modified on an user.
    ** It DOESN'T get updated on any other operation than thoses performed by the user controller.
    */
    public users: User[] = null;

    public config :ADA_Config = {
        SMTP_Host: null,
        SMTP_User: null,
        SMTP_Port: null,
        SMTP_Password: null,
        Default_Password: null,
        Hostname: null,
        UsingCustomGenerator: null,
        UnderMaintenance: null,
        ADAInstanceId: null,
    };

}

export default ADA;