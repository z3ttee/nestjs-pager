# NestJS Pager
A simple Pagination implementation for NestJS applications and is built using NestJS' RepositoryAPI.

## Table of Contents
1. [Installation](https://github.com/z3ttee/nestjs-pager#installation)
2. [Prerequisites](https://github.com/z3ttee/nestjs-pager#prerequisites)
3. [Usage](https://github.com/z3ttee/nestjs-pager#usage)
4. [How the URL is built](https://github.com/z3ttee/nestjs-pager#how-the-url-is-built)
5. [Using default page settings](https://github.com/z3ttee/nestjs-pager#using-default-page-settings)
6. [Filtering](https://github.com/z3ttee/nestjs-pager#filtering)

## Installation
```
npm install nestjs-pager
```

## Prerequisites
You should be familiar with the concept of NestJS, especially with the RepositoryAPI and the fundamental terms. Basic understanding of NestJS' database
and typeorm is optional, but helps to understand what happens in the background of this package.

## Usage
This project relies on decorators, rather than calling functions. This makes the 
usability pretty straight forward. Let's have a look on how to use the `@Pageable` decorator.<br><br>
The `@Pageable` decorator is used inside the route handlers as parameter decorator. Below is an example of a 
basic controller implementation:
```typescript
import { PageableRepository } from "nestjs-pager";
import { EntityRepository } from "typeorm";
import { SomeEntity } from "./your-entity";

@EntityRepository(SomeEntity)
export default class SomeEntitiesRepository extends PageableRepository<SomeEntity> {
    
    // Add your custom functionality here...

}
```
As you may notice we extend the `PageableRepository<T>` generic class from `nestjs-pager` instead of the `Repository<T>` which comes from NestJS directly.
Internally there is not much of a difference between these two. `PageableRepository<T>` just simply extends `Repository<T>`, but adds a method for pagination.
Let's see what we have to do on the controller to enable pagination:
```typescript
import { Get } from '@nestjs/common';
import { Pageable, Page } from "nestjs-pager";
import { SomeEntitiesRepository } from './SomeEntitiesRepository.ts';
import { SomeEntity } from "./your-entity";

@Controller('services')
export class SomeController {
    constructor(private repository: SomeEntitiesRepository) {}

    // Add @Pageable to an function argument to enable pagination
    @Get()
    public listEntities(@Pageable() pageable: Pageable): Promise<Page<SomeEntity>> {
        return this.repository.listAll(pageable);
    }
}
```
That is all you have to do to add support for pagination.<br>
We inject our `PageableRepository<T>` implementation called `SomeEntitiesRepository` into the controller class so that we can use that repository.<br>
Because our repository extends this library's PageableRepository, we can call the `listAll(pageable)` function. This returns a Promise of type `Page<T>`.<br><br>
Now let's recap what we did:
1. Create a Repository (do not forget the `@EntityRepository(SomeEntity)` decorator) that extends `PageableRepository<T>` with the desired returned type `T`.
2. Create a controller and inject our repository.
3. Create a route on that controller.
4. To add pagination support, add an argument to the route's function like: `@Pageable() pageable: Pageable`
5. Inside the function call `this.repository.listAll(pageable)`

## How the URL is built
For paginate on your requests, you just need to add two query parameters:
```
http://localhost:3000/your/route?page=0&size=30
```
This would result in the <b>first</b> page being returned consisting of <b>30</b> entries.

## Using default page settings
You can define route specific default settings for pagination. There is currently a hard-coded global cap regarding the page size and hits at 50 entries per page.
Therefor every page size above 50 adjusts back to 50.<br>
To define your default page settings, you can provide an object of `Pageable` to the `@Pageable()` decorator:
```typescript
@Controller('services')
export class SomeController {

    @Get()
    public listEntities(@Pageable({
        page: 1,
        size: 30
    }) pageable: Pageable): Promise<Page<SomeEntity>> {
        return this.repository.listAll(pageable);
    }
}
```
Now on every request the decorator will check if `page` or `size` exists and if not the default values will be set.
(NOTE: Of course you may not want to set a default page, because this would always return that one page if no `page`-query parameter is defined.)<br>
Using these default settings, we will always get page nr. 2 (if page = 0, we would get page nr. 1 returned (works like index of an array)) returned with 30 entries, but only if there's no `page` or `size` query parameter.

## Filtering
The purpose of filtering is to include or exclude specific fields of the response object that will be returned. For example using `@ExcludeFilter()` allows us to return all properties of an object, except of the ones specified in the url. <br> A controller method using this parameter decorator then supports the exclusion filter. To apply the filter you need to add a query parameter to your requested url like that:
```
For including properties:
http://localhost:3000/your/route?select=["include", "these", "fields"]
```
If you want to explicitly include fields rather then excluding, you would have to use the `@Filter()` parameter decorator instead.
Both decorators return a `string[]` array, which can then be used together with typeorm. Let's take a look at a complete example:
// TODO
<br>
Also NOTE: Because of how typeorm is designed, including properties, that are internally handled as relationships causes errors. Under some circumstances it can break queries, because relationship fields aren't actual columns in databases. Please consider exluding or not including them.