import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FindManyOptions, Repository } from "typeorm";

export class Properties extends Array<string> {}
export const Filter = createParamDecorator((type: { new(...args: any[]): any; }, ctx: ExecutionContext): Properties => {
    const properties = new Properties()

    // Rework, so that relations can be included. Maybe call it FilterOptions?

    try {
        const wildcard = Object.keys(new type())
        const request = ctx.switchToHttp().getRequest();

        if(request.query.filter) {
            properties.push(...([ ...JSON.parse(request.query.filter) ] || []).filter((val) => wildcard.includes(val)))
        } else {
            properties.push(...wildcard)
        }
    } catch (err) {
        console.error(err)
    }

    return properties;
})

export interface Pageable {
    size?: number;
    page?: number;
}

export class Page<T> {
    public totalElements: number;
    public totalPages: number;
    public amount: number;
    public activePage: number;
    public activePageSize: number;
    public elements: T[];

    constructor(totalElements: number, activePage: number, elements: T[]) {
        this.totalElements = totalElements;
        this.activePageSize = elements.length;
        this.totalPages = Math.ceil((totalElements || 0) / (this.activePageSize || 1));
        this.elements = elements;
        this.amount = elements.length;
        this.activePage = activePage;
    }

    public static of<Type>(elements: Type[], totalElements?: number, activePage?: number): Page<Type> {
        return new Page<Type>(totalElements || elements.length, activePage || 0, elements);
    }
}

export const Pageable = createParamDecorator(
    (defaults: Pageable, ctx: ExecutionContext): Pageable => {        
        const request = ctx.switchToHttp().getRequest();
                
        let pageNr = parseInt(request.query.page) || defaults?.page || 0;
        let pageSize = parseInt(request.query.size) || defaults?.size || 50;

        if(pageNr < 0) pageNr = 0;
        if(pageSize <= 0) pageSize = 1;
        if(pageSize > 50) pageSize = 50;

        return {
            page: pageNr,
            size: pageSize
        }
    }
);

export class PageableRepository<T> extends Repository<T> {
    public findAll(pageable: Pageable, options?: FindManyOptions<T>): Promise<Page<T>> {
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