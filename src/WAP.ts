import Part from "./models/part";
import Sprint from "./models/sprint";
import User from "./models/user";

class WAP {
    public sprint: Sprint = null;
    public parts: Part[] = null;

    /*
    ** *WARNING*: Do not use users for anything else than getting a list and names of already existing users.
    ** This field only get updated when personnal informations (such as name) are modified on an user.
    ** It DOESN'T get updated on any other operation than thoses performed by the user controller.
    */
    public users: User[] = null;
}

export default WAP;