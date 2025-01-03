import baseObject from "@dbObjects/baseObject";
import Card from "@dbObjects/Card";
import Agent from "@dbObjects/Agent";

export default class Transaction extends baseObject {

    private constructor(id: bigint) {
        super(id);
    }

    public static async get(id: bigint): Promise<Transaction> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT * FROM transaction WHERE id = ?", [id]).then((results) => {
                if (results.length === 0) {
                    return reject("Transaction not found");
                }

                resolve(new Transaction(id));

            }).catch(reject);
        });
    }

    public async getCard(): Promise<Card> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT carte_id FROM transaction WHERE id = ?", [this.id]).then((results) => {
                if (results.length === 0) {
                    return reject("Card not found");
                }

                Card.get(results[0].carte_id).then((result) => resolve(result!)).catch(reject);

            }).catch(reject);
        });
    }

    public async getAgent(): Promise<Agent> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT agent_id FROM transaction WHERE id = ?", [this.id]).then((results) => {
                if (results.length === 0) {
                    return reject("Agent not found");
                }

                Agent.get(results[0].agent_id).then(agent => resolve(agent!)).catch(reject);

            }).catch(reject);
        })
    }



}