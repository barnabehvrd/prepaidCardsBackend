import {Router, Response} from 'express';
import validate from "@utils/bodyValidation"
import transactionBody from "@clientObjects/transaction";

import NotFoundError from '@errors/NotFoundError';

const router = Router();

import prismaClient from "@prismaClient";
import {z} from "zod";

import {AuthenticatedRequest} from "@utils/auth/AuthenticatedRequest";
import authenticate from "@utils/auth/authenticate";
import asyncHandler from "@utils/asyncHandler";
import {Card, User} from "@prisma/client";
import InsufficientBalanceError from "@errors/insufficientBalanceError";
import DisabledCardUseError from "@errors/DisabledCardUseError";
import deepTransformDecimals from "@utils/deepTransformDecimals";

type TransactionForm = z.infer<typeof transactionBody>;

router.post('/card/:cardid/transaction', authenticate, validate(transactionBody),
    asyncHandler(async (req: AuthenticatedRequest<TransactionForm>, res: Response) => {

        const card = await prismaClient.card.findUnique({
            where: {
                id: req.params.cardid,
                user: {
                    organizationId: req.admin!.organizationId,
                    deleted: false
                }
            },
            include: {
                user: true
            },

        }) as (Card & { user: User }) | null;

        if (card === null) {
            throw new NotFoundError();
        }

        if (card.enabled === false) {
            throw new DisabledCardUseError();
        }

        if (card.user.balance.toNumber() < req.body.amount && req.body.amount < 0) {
            throw new InsufficientBalanceError();
        }

        const newBalance = card.user.balance.toNumber() + req.body.amount;

        const data = await prismaClient.$transaction([
            prismaClient.user.update({
                where: {
                    id: card.user.id
                },
                data: {
                    balance: newBalance
                }
            }),
            prismaClient.transaction.create({
                data: {
                    amount: req.body.amount,
                    type: req.body.type,
                    description: req.body.description,
                    cardId: card.id,
                    adminId: req.admin!.id,
                },
                include: {
                    card: {
                        include: {
                            user: true
                        }
                    }
                }
            })
            ]
        )

        res.status(201)
        // On ne récupère que la transaction qui nous intéresse
        res.json(data[1]);
    }));

router.get('/card/:cardId/transactions',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

        const start = Number(req.query.start) || 0;
        const count = Number(req.query.count) || 10;

        const user = await prismaClient.card.findUnique({
            where: {
                id: req.params.cardId,
            }
        });

        if (user === null) {
            throw new NotFoundError();
        }

        const transactions = await prismaClient.transaction.findMany({
            where: {
                cardId: req.params.cardId,
            },
            skip: start,
            take: count,

            orderBy: {
                date: 'desc'
            }
        });

        res.status(200);
        res.json(deepTransformDecimals(transactions));
    }));

router.get('/user/:userId/transactions',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

        const start = Number(req.query.start) || 0;
        const count = Number(req.query.count) || 10;

        const user = await prismaClient.user.findUnique({
            where: {
                id: req.params.userId,
            }
        });

        if (user === null) {
            throw new NotFoundError();
        }

        const transactions = await prismaClient.transaction.findMany({
                where: {
                    card: {
                        userId: req.params.userId,
                    }
                },
                skip: start,
                take: count,

                orderBy: {
                    date: 'desc'
                }
            });

        res.status(200);
        res.json(deepTransformDecimals(transactions));
    }));


export default router;