declare module 'node-mocks-http' {
    import express = require('express');

    module __nodeMocksHttp {
        interface ICreateRequestOptions {
            method?: string;
            url?: string;
            originalUrl?: string;
            params: {[key: string]: any};
            body: any;
        }
        function createRequest(
            options?: ICreateRequestOptions
        ): express.Request;

        interface ICreateResponseOptions {
            encoding?: string;
        }
        function createResponse(
            options?: ICreateResponseOptions
        ): express.Response;
    }

    export = __nodeMocksHttp;
}
