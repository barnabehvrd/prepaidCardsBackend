import { Router, Request, Response } from 'express';
import Db from '@utils/db';
import authenticate from "@utils/auth/authenticate";

import cardSchema from "@utils/interfaces/client/carte";
const router = Router();

router.get('/cards', authenticate, (req: Request, res: Response) => {

    Db.getInstance().getCards().then((cards) => {
        res.send(cards);
    });
});


router.post('/cards', authenticate, (req: Request, res: Response) => {
    const parsedBody = cardSchema.safeParse(req.body);
    if (!parsedBody.success) {res.status(400).send(parsedBody.error);return;}

    Db.getInstance().addCard(req.body.prenom, req.body.nom).then((card) => {
        res.send(card);
    });
});



// Pas d'authentification pour cette route
// => Permets d'avoir les infos directement en scannant sa carte
router.get('/cards/:id', (req: Request, res: Response) => {

    Db.getInstance().getCard(req.params.id).then((card) => {
        res.send(card);
    });
});

export default router;