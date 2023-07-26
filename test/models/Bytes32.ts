export class Bytes32 {
    private id: string;

    constructor(id: string) {
        this.id = id;
    }

    public toString() {
        return this.id;
    }
}
