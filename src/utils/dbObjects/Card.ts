import baseObject from "@utils/dbObjects/baseObject";
import Profile from "@utils/dbObjects/Profile";
import Transaction from "@utils/dbObjects/Transaction";

import {CardWithProfile, CardWithProfileID} from "@utils/interfaces/server/carte";


export default class Card extends baseObject {

    private constructor(id: number) {
        super(id);
    }

    public static async get(id: number): Promise<Card> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT * FROM carte WHERE id = ?", [id]).then((results) => {
                if (results.length === 0) {
                    return reject("Card not found");
                }

                resolve(new Card(results[0].id));

            }).catch(reject);
        });
    }

    // Active la carte (= autorise les transactions via cette carte)
    public async enable(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.query("UPDATE carte SET enabled = 1 WHERE id = ?", [this.id]).then(() => {
                resolve();
            }).catch(reject);
        });
    }

    // Désactive la carte (= interdit les transactions via cette carte)
    public async disable(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.query("UPDATE carte SET enabled = 0 WHERE id = ?", [this.id]).then(() => {
                resolve();
            }).catch(reject);
        });
    }

    public async isEnabled(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT enabled FROM carte WHERE id = ?", [this.id]).then((results) => {
                resolve(results[0].enabled === 1);
            }).catch(reject);
        });
    }

    public async getOwner(): Promise<Profile> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT profile_id FROM carte WHERE id = ?", [this.id]).then((results) => {
                if (results.length === 0) {
                    return reject("Owner not found");
                }

                Profile.get(results[0].profile_id).then(resolve).catch(reject);

            }).catch(reject);
        })
    }

    public async getTransactions(startAt: number, quantity: number): Promise<Transaction[]> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT id FROM transaction WHERE carte_id = ? ORDER BY date DESC LIMIT ?, ?", [this.id, startAt, quantity]).then((results) => {
                if (results.length === 0) {
                    return resolve([]);
                }

                let promises = results.map((result: any) => {
                    return Transaction.get(result.id);
                });

                Promise.all(promises).then(resolve).catch(reject);

            }).catch(reject);
        });
    }

    public async getOwnerID(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.select("SELECT profile_id FROM carte WHERE id = ?", [this.id]).then((results) => {
                if (results.length === 0) {
                    return reject("Owner not found");
                }

                resolve(results[0].profile_id);

            }).catch(reject);
        })
    }

    public async toJSON(): Promise<CardWithProfile> {

        let owner = await this.getOwner();
        let transactions = await this.getTransactions(0, 10);

        return {
            id: this.id,
            profile: await owner.toJSON(),
            enabled: await this.isEnabled()
        }
    }

    public async toSimpleJSON(): Promise<CardWithProfileID> {
        return {
            id: this.id,
            profileID: await this.getOwnerID(),
            enabled: await this.isEnabled()
        }
    }
}

