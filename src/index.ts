import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FindManyOptions, Repository } from "typeorm";

import { Filter } from "./filtering/filter";
export {
    Filter
}

/**
 * Class to handle
 * page settings.
 */
export class Pageable {
    constructor(
        /**
         * Current page index.
         * Should begin at 0 as it is directly
         * used in offset() or skip() calls on typeorm
         * queries.
         */
        public page: number,
        /**
         * Size of the page.
         * Must be at least 1 and at most 50
         */
        public size: number
    ){}
}

export class Page<T> {
    /**
     * Total amount of available pages for that query.
     * This value is calculated via totalElements/requestedSize.
     */
    public readonly totalPages: number;
    /**
     * The requested page size.
     */
    public readonly requestedSize: number;
    /**
     * The current size of the page, indicating
     * how many items were for found for the 
     * requested page
     */
    public readonly size: number;

    constructor(
        /**
         * Available items available in total via
         * the executed query.
         */
        public readonly totalElements: number, 
        /**
         * Requested page index
         */
        public readonly requestedPage: number, 
        /**
         * List of found elements
         */
        public readonly elements: T[]
    ) {
        this.requestedSize = elements.length;
        this.totalPages = Math.ceil((totalElements || 0) / (this.requestedSize || 1));
        this.size = elements.length;
    }

    /**
     * Create new page result.
     * @param elements Results of the page
     * @param totalElements Available items available in total
     * @param requestedPage Requested page index
     * @returns Page<Type>
     */
    public static of<Type>(elements: Type[], totalElements?: number, requestedPage: number = 0): Page<Type> {
        return new Page<Type>(totalElements || elements.length, requestedPage || 0, elements);
    }
}

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
/**
 * Class that introduces some functions
 * to handle pagination queries using typeorm.
 */
export class PageableRepository<T> extends Repository<T> {
    /**
     * Find a page of results.
     * @param pageable Page settings
     * @param options Find options
     * @returns Page<T>
     * @deprecated Please use findPage()
     */
    public findAll(pageable: Pageable, options?: FindManyOptions<T>): Promise<Page<T>> {
        return this.findPage(pageable, options);
    }

    /**
     * Find a page of results.
     * @param pageable Page settings
     * @param options Find options
     * @returns Page<T>
     */
    public findPage(pageable: Pageable, options?: FindManyOptions<T>): Promise<Page<T>> {
        return new Promise((resolve) => {
            if(!options) options = {};
            
            options.skip = pageable.page * pageable.size;
            options.take = pageable.size;

            this.findAndCount(options).then((result: [T[], number]) => {
                resolve(new Page<T>(result[1] || 0, pageable.page, result[0]));
            }).catch(() => {
                resolve(new Page<T>(0, pageable.page, []));
            });
        })
    }
}