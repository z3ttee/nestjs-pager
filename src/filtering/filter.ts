import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface Filter {
    select: string[],
    relations: string[]
}

export const Filter = createParamDecorator<{ new(...args: any[]): any; }, ExecutionContext, Filter>((type: { new(...args: any[]): any; }, ctx: ExecutionContext): Filter => {
    if(!type) throw new TypeError("Please consider defining a type in the '@Filter(<here>)' decorator.")
    let filter: Filter = { select: [], relations: [] };

    try {
        const wildcard = Object.keys(new type())
        const request = ctx.switchToHttp().getRequest();

        if(request.query.select) {
            filter.select = ([ ...request.query.select ] || []).filter((val) => wildcard.includes(val));
        } else {
            filter.select = wildcard;
        }

        if(request.query.relations) {
            filter.relations = ([ ...request.query.select ] || [])
        }

    } catch (err) {
        if(!(err instanceof SyntaxError)) {
            console.error(err)
        }
    }

    return filter;
})

