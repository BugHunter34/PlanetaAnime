import {useEffect, useState } from 'react';
import { getValidApiUrl } from '../services/urlService';


export default function Test() {

    const [status, setStatus] = useState('Fetching...');
    useEffect(() => {
    const checkServerStatus = async () => {
        try {
        const API_URL = await getValidApiUrl();
        const res = await fetch(`${API_URL}/brew-coffee`);
        setStatus(res)
        } catch (error) {
        res = "Error"
        }
    };
    checkServerStatus();
    }, []);


    return(
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Error</title>
        </head>
        <body>
            {status}
        </body>
        </html>
    )
}