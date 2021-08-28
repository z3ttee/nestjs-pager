import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FindManyOptions, Repository } from "typeorm";

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

    constructor(totalElements: number, activePage: number, activePageSize: number, elements: T[]) {
        this.totalElements = totalElements;
        this.totalPages = Math.ceil(totalElements / activePageSize);
        this.elements = elements;
        this.amount = elements.length;
        this.activePage = activePage;
        this.activePageSize = activePageSize;
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
            options.skip = pageable.page * pageable.size;
            options.take = pageable.size;

            this.findAndCount(options).then((result: [T[], number]) => {
                resolve(new Page<T>(result[1], pageable.page, pageable.size, result[0]));
            }).catch(() => {
                resolve(new Page<T>(0, pageable.page, pageable.size, []));
            });
        })
    }

}