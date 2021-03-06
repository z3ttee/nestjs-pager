import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Pageable } from "./pageable";

/**
 * Pagination decorator to get page settings from
 * url on NestJS http requests.
 * If no value for "size" or "page" is set, it defaults
 * to size=50 or page=0.
 * You can overwrite those default values by passing a Pageable object
 * with custom values to the decorator.
 * 
 * NOTE: You cannot have page sizes of <= 0 or > 50. That means page sizes are always between
 * min. 1 and max. 50.
 * 
 * @param defaults Default page settings if some values are missing in url query
 * @returns Pageable - Page settings object
 */
export const Pagination = createParamDecorator(
    (defaults: Pageable, ctx: ExecutionContext): Pageable => {        
        const request = ctx.switchToHttp().getRequest();

        let pageNr = parseInt(request.query?.page) || defaults?.page || 0;
        let pageSize = parseInt(request.query?.size) || defaults?.size || 50;

        if(pageNr < 0) pageNr = 0;
        if(pageSize <= 0) pageSize = 1;
        if(pageSize > 50) pageSize = 50;

        return new Pageable(pageNr, pageSize);
    }
);