import { Request, Response } from 'express';


export async function handleWebhookGet( _req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production') console.log('GET / webhook HIT')
    return res.sendStatus(200);
}

export async function handleWebhookPost(_req: Request, res: Response) {
    try{
        return res.sendStatus(403);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
        return res;
        
    }
}
