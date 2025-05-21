# MDXLD Ontology

The MDXLD ontology extends [schema.org](https://schema.org) with terms used when describing code and software projects in Markdown frontmatter.  The ontology is provided as a JSON‑LD context file `context.jsonld` that maps short names to full IRIs.  MDXLD frontmatter uses `$context`, `$id` and `$type` to reference these terms.

This document lists the classes and properties currently defined in the context file and shows how they can be used inside frontmatter blocks.

## Classes

### `Component`
*Subclass of `schema:CreativeWork`*

Properties:
- `framework` – technology the component is built with (e.g. React)
- `propsSchema` – link to a JSON Schema describing component props
- `status` – development stage (`StatusType` enumeration)

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$id: https://example.com/components/button
$type: Component
name: Button
framework: React
propsSchema: ./Button.schema.json
status: Prototype
---
```

### `Function`
*Subclass of `schema:CreativeWork`*

Properties:
- `parameters` – description of accepted parameters
- `returnType` – description of the return value
- `programmingLanguage` – language of implementation

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$type: Function
name: fetchData
parameters: url, options
returnType: Promise<Response>
programmingLanguage: TypeScript
---
```

### `Module`
*Subclass of `schema:SoftwareSourceCode`*

Properties:
- `version` – module version string
- `dependencies` – list of required modules
- `programmingLanguage` – language used

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$id: https://example.com/pkg/mylib
$type: Module
name: mylib
version: 1.2.0
dependencies:
  - lodash
programmingLanguage: TypeScript
---
```

### `API`
*Subclass of `schema:WebAPI`*

Properties:
- `endpointURL` – URL of the endpoint
- `httpMethod` – HTTP verb used
- `requestSchema` – schema describing the request body
- `responseSchema` – schema describing the response
- `requiresAuth` – boolean indicating whether authentication is required

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$id: https://api.example.com/v1/create
$type: API
endpointURL: https://api.example.com/v1/create
httpMethod: POST
requestSchema: ./schemas/createRequest.json
responseSchema: ./schemas/createResponse.json
requiresAuth: true
---
```

### `App`
*Subclass of `schema:SoftwareApplication`*

Properties:
- `platform` – platform type (`PlatformType` enumeration)
- `pricingPlan` – free, paid or other plan description
- `launchDate` – ISO date string

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$type: App
name: MyApp
platform: Web
pricingPlan: Free
launchDate: 2024-05-15
---
```

### `Marketplace`
*Subclass of `schema:WebSite`*

Properties:
- `sellerCount` – number of sellers on the platform
- `productCategories` – list of categories offered
- `commissionModel` – how commission is calculated

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$type: Marketplace
name: Widgets Market
sellerCount: 120
productCategories:
  - Widgets
  - Accessories
commissionModel: 5% per sale
---
```

### `Directory`
*Subclass of `schema:ItemList`*

Properties:
- `entryType` – type of entries in the directory
- `domainFocus` – main subject area
- `entryCount` – number of items listed

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$type: Directory
name: Tools Directory
entryType: Software Tool
domainFocus: Developer Productivity
entryCount: 50
---
```

### `Service`
*Refines `schema:Service`*

Properties:
- `serviceType` – classification of the service offered
- `audience` – intended audience description
- `pricingModel` – how pricing is calculated

Example:
```yaml
---
$context: https://mdxld.org/context.jsonld
$type: Service
name: Consulting Service
serviceType: Development Consulting
audience: Startups
pricingModel: Hourly
---
```

## Enumerations

The context defines the following enumeration values used in several classes:

- `StatusType` – `Prototype`, `MVP`, `Beta`, `Production`
- `PlatformType` – `Web`, `iOS`, `Android`

These values may appear directly in frontmatter fields like `status` or `platform`.

## Using the Context

Include the context URL in your frontmatter with `$context` so that all terms above resolve to their full IRIs.  Standard schema.org properties can be mixed freely with these MDXLD terms.
