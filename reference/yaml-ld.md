**Objective**  
This document defines YAML-LD, a set of conventions built on top of YAML, which outlines how to serialize Linked Data as YAML based on JSON-LD syntax, semantics, and APIs. The emergence of YAML as a more concise format for representing information previously serialized as JSON, including Linked Data, has led to the development of YAML-LD.

**Methods**  
This document defines constraints on YAML so that any YAML-LD document can be represented in JSON-LD. This is necessary because YAML is more expressive than JSON, in terms of both available data types and document structure. This document also registers the `application/ld+yaml` media type.

**Results**  
This document provides a clear description of how to serialize Linked Data in YAML. It also describes the basic concepts and core requirements for implementing YAML-LD, including a comparison of JSON versus YAML, the supported YAML features, and encoding considerations.

**Limitations**  
The YAML feature set is richer than that of JSON, and a number of YAML features are not supported in this specification. However, ground is laid for future development of a version of YAML-LD which will support those features — via the Extended YAML-LD Profile.

**Conclusions**  
YAML-LD offers an efficient way to encode Linked Data in a variety of programming languages which can use YAML.

**An introductory YAML-LD example** is presented below.

This document has been developed by the [JSON-LD Community Group](https://www.w3.org/community/json-ld/).

## Introduction

\[\[JSON-LD11\]\] is a JSON-based format to serialize Linked Data. In recent years, \[\[YAML\]\] has emerged as a more concise format to represent information that had previously been serialized as \[\[JSON\]\], including API specifications, data schemas, and Linked Data.

This document defines YAML-LD as a set of conventions on top of YAML which specify how to serialize Linked Data \[\[LINKED-DATA\]\] as \[\[YAML\]\] based on JSON-LD syntax, semantics, and APIs.

Since YAML is more expressive than JSON, both in the available data types and in the document structure (see \[\[RFC9512\]\]), this document identifies constraints on YAML such that any YAML-LD document can be represented in JSON-LD.

See YAML-LD description of this spec at [`spec.yaml`](data/spec.yaml) .

## How to read this document

To understand the basics of this specification, one must be familiar with the following:

- \[\[YAML\]\] data markup language, which is the underlying syntax for YAML-LD
- basic Linked Data \[\[LINKED-DATA\]\] principles

This document is intended primarily for two main audiences, as described below.

- **Software developers** who want to —

  - encode Linked Data in a variety of programming languages which can use YAML
  - convert existing YAML to YAML-LD
  - understand the design decisions and language syntax for YAML-LD
  - implement processors and APIs for YAML-LD
  - generate or consume Linked Data, an RDF Graph, or an RDF Dataset in a YAML syntax

  Among related technologies, JSON-LD familiarity would be required to build most YAML-LD capable applications, while RDF familiarity is only required when it is desired to convert YAML-LD to RDF graphs, or vice versa.

- **Other professionals, both IT and otherwise** who want to read and/or produce Linked Data documents in YAML-LD format. Such documents can be —

  - consumed by programming systems capable of understanding YAML-LD
  - transformed with JSON-LD framing algorithms
  - published on the Web for human and machine consumption

  For these users, familiarity with JSON-LD is not required, but understanding of Linked Data principles might be beneficial.

## Terminology

This document uses the following terms as defined in external specifications and defines terms specific to JSON-LD.

A YAML-LD stream is a YAML stream of YAML-LD documents.

A YAML-LD document is any YAML document from which a conversion to \[\[JSON\]\] produces a valid JSON-LD document which can be interpreted as \[\[LINKED-DATA\]\].

The term media type is imported from \[\[RFC6838\]\].

The term JSON is imported from \[\[JSON\]\].

The term JSON document represents a serialization of a resource conforming to the \[\[JSON\]\] grammar.

The terms JSON-LD document, and value object are imported from \[\[JSON-LD11\]\].

The terms internal representation, and documentLoader are imported from \[\[JSON-LD11-API\]\].

The terms array, boolean, map, map entry, null, and string are imported from \[\[INFRA\]\].

The term number is imported from \[\[ECMASCRIPT\]\].

The terms YAML, YAML representation graph, YAML stream, YAML directive, TAG directive, YAML document, YAML sequence (either block sequence or flow sequence), YAML mapping (either block mapping or flow mapping), node, scalar, node anchor, node tags, and alias node, are imported from \[\[YAML\]\].

The term content negotiation is imported from \[\[RFC9110\]\].

The terms RDF literal, language-tagged string, datatype IRI, and language tag are imported from \[\[RDF11-CONCEPTS\]\].

The terms fragment and fragment identifier in this document are to be interpreted as in \[\[URI\]\].

The term Linked Data is imported from \[\[LINKED-DATA\]\].

## Namespace Prefixes

This specification makes use of the following namespace prefixes:

Prefix

IRI

ex

https://example.org/

i18n

https://www.w3.org/ns/i18n#

rdf

http://www.w3.org/1999/02/22-rdf-syntax-ns#

rdfs

http://www.w3.org/2000/01/rdf-schema#

xsd

http://www.w3.org/2001/XMLSchema#

schema

https://schema.org/

prov

http://www.w3.org/ns/prov#

See YAML-LD version of this table at [`namespace-prefixes.yaml`](data/namespace-prefixes.yaml) .

These are used within this document as part of a compact IRI as a shorthand for the resulting IRI, such as `schema:url` used to represent `https://schema.org/url`.

A YAML-LD document complies with the YAML-LD Basic profile of this specification if it follows the normative statements from this specification and can be transformed into a \[\[JSON-LD11\]\] representation, then back to a conforming YAML-LD document, without loss of semantic information.

For convenience, normative statements for documents are often phrased as statements on the properties of the document.

## JSON-LD Version

YAML-LD supports \[\[\[JSON-LD11\]\]\] \[\[JSON-LD11\]\] and later.

## Test Suites

To be conformant, an implementation MUST satisfy all test cases from the following test suites:

- [YAML-LD tests](https://json-ld.github.io/yaml-ld/tests/);
- [JSON-LD API tests](https://w3c.github.io/json-ld-api/tests/);
- [JSON-LD Framing tests](https://w3c.github.io/json-ld-framing/tests/),

...with the exclusion of the test cases where:

- [processingMode](#dfn-processingmode) option is provided and set to \`json-ld-1.0\`.

Since YAML is a superset of JSON, testing a YAML-LD against tests cases from JSON-LD test suites should be trivial.

## Basic Concepts

### JSON vs YAML comparison

YAML is a superset of JSON, i.e., every valid JSON document is also a valid YAML document. YAML also offers a number of extra features, chief amongst which is improved human readability due to the ability to use minimal punctuation.

YAML is more flexible than JSON, as illustrated by the comparison table below.

Features

\[\[JSON\]\]

\[\[YAML\]\]

Allowed encodings

UTF-8

✅

✅

UTF-16

❌

✅

UTF-32

❌

✅

Native data types

`{}` object

✅

✅

`[]` array

✅

✅

string

✅

✅

number

✅

✅  
integer  
floating point

bool

✅

✅

null

✅

✅

Features

Delimited strings, arrays, objects

✅

✅

Punctuation-free strings, arrays, objects

❌

✅

Custom types

❌

✅ via tags

Cycles

❌

✅

Documents per file

1

⩾ 1 via YAML stream

Comments

❌

✅

Anchors & aliases

❌

✅

Mapping key types

`string`

Any type representable in YAML, from strings to mappings

See YAML-LD version of this table at [`json-vs-yaml.yaml`](data/json-vs-yaml.yaml) .

The first goal of this specification is to allow a JSON-LD document to be processed and serialized into YAML, and then back into JSON-LD, without losing any semantic information.

This is always possible because

- a YAML representation graph can always represent a tree
- set of JSON data types is a subset of the set of YAML data types
- JSON encoding is UTF-8.

Example: The JSON-LD document below

Can be serialized as YAML as follows. Note that entries starting with \`@\` need to be enclosed in quotes because \`@\` is a reserved character in YAML.

This document is based on YAML 1.2.2, but YAML-LD is not tied to a specific version of YAML. Implementers concerned about features related to a specific YAML version can specify it in documents using the \`%YAML\` directive (see [](#int)).

## Core Requirements

## YAML features supported by YAML-LD

Encoding

UTF-8 [only](#encoding).

Native data types

Every native data type that the YAML-LD parser supports.

Tags

Ignored.

Comments

[Treated as whitespace](#comments).

Anchors & aliases

Resolved by YAML parser. Anchors & alias names are ignored.

Cycles defined using anchors & aliases

Not permitted.

YAML Streams

Treated identically to arrays.

Mapping key types other than `string`

[Not supported.](#mapping-key-types)

Perspectives for support of the additional YAML features are analyzed in [Extended Profile](#extended-profile) informative addendum to this specification.

## Encoding

A YAML-LD document MUST be encoded in UTF-8, to ensure interoperability with \[\[JSON\]\]; otherwise, an invalid-encoding MUST be detected, and processing aborted.

## Comments

Comments in YAML-LD documents are treated as white space.

See Interoperability considerations of "+yaml" structured syntax suffix for more details.

## Anchors and Aliases

Since anchor names are a serialization detail, such anchors MUST NOT be used to convey relevant information, MAY be altered when processing the document, and MAY be dropped when interpreting the document as JSON-LD.

A YAML-LD document MAY contain anchored nodes and alias nodes, but its representation graph MUST NOT contain cycles; otherwise, a loading-document-failed error MUST be detected, and processing aborted.

When interpreting the document as JSON-LD, alias nodes MUST be resolved by value to their target nodes.

The YAML-LD document in the following example contains alias nodes for the \`{"@id": "country:US"}\` object:

While the representation graph (and eventually the in-memory representation of the data structure, e.g., a Python dictionary or a Java hashmap) will still contain references between nodes, the JSON-LD serialization will not — since, by the time it is formed, all the anchors have been resolved, as shown below.

## Mapping Key Types

Mapping key type MUST be a `string`. Otherwise, a processing error is raised.

## Security Considerations

See Security considerations in JSON-LD 1.1 and `+yaml` structured syntax suffix.

## Interoperability Considerations

For general interoperability considerations on the serialization of JSON documents in \[\[YAML\]\], see YAML and the Interoperability considerations of the `+yaml` structured syntax suffix.

The YAML-LD format and the media type registration are not restricted to a specific version of YAML, but implementers that want to use YAML-LD with YAML versions other than 1.2.2 need to be aware that the considerations and analysis provided here, including interoperability and security considerations, are based on the YAML 1.2.2 specification.

## Embedding YAML-LD in HTML Documents

YAML-LD content can be easily embedded in HTML \[\[HTML\]\] by placing it in a `<script>` element with the \`type\` attribute set to \`application/ld+yaml\`, as illustrated in an example below.

YAML syntax is indentation based. Therefore, when processing each \`<script>\` block with YAML-LD content, YAML-LD processor MUST preserve the content of the block for YAML parsing _as-is_, including whitespace characters.

If the YAML-LD `<script>` tag contains a YAML Stream with multiple YAML documents, each of these documents MUST be treated as if it was included in a separate `<script>` tag. See [Streams](#streams) for details.

## Streams

Every YAML-LD file is a YAML-LD stream and might contain multiple YAML-LD documents, as shown in the example below.

\[\[JSON-LD11-API\]\] defines the \`extractAllScripts\` flag, which allows to parse multiple \`<script>\` tags with YAML-LD content.

A conformant YAML-LD specification MUST take this flag into account while parsing a normal YAML-LD document.

- If the flag is \`true\`, the YAML stream is considered an array, and each document in it is an item in that array, even if there is only one document in the stream;
- If the flag is \`false\`, only the first document in the stream will be processed.

For interoperability considerations on YAML streams, see the relevant section in YAML Media Type.

## IANA Considerations

This section has been submitted to the Internet Engineering Steering Group (IESG) for review, approval, and registration with IANA.

This section describes the information required to register the above media type according to \[\[RFC6838\]\]

### application/ld+yaml

Type name:

application

Subtype name:

ld+yaml

Required parameters:

N/A

Optional parameters:

`profile`

A non-empty list of space-separated URIs identifying specific constraints or conventions that apply to a YAML-LD document according to \[\[RFC6906\]\]. A profile does not change the semantics of the resource representation when processed without profile knowledge, so that clients both with and without knowledge of a profiled resource can safely use the same representation. The `profile` parameter MAY be used by clients to express their preferences in the content negotiation process. If the profile parameter is given, a server SHOULD return a document that honors the profiles in the list which it recognizes, and MUST ignore the profiles in the list which it does not recognize. It is RECOMMENDED that profile URIs are dereferenceable and provide useful documentation at that URI. For more information and background please refer to \[\[RFC6906\]\].

This specification allows the use of the \`profile\` parameters listed in and additionally defines the following:

`http://www.w3.org/ns/json-ld#extended`

To request or specify [extended](#extended-profile) YAML-LD document form.

This is a placeholder for specifying something like an [extended](#extended-profile) YAML-LD document form making use of YAML-specific features.

When used as a media type parameter \[\[RFC4288\]\] in an HTTP Accept header field \[\[RFC9110\]\], the value of the `profile` parameter MUST be enclosed in quotes (`"`) if it contains special characters such as whitespace, which is required when multiple profile URIs are combined.

When processing the "profile" media type parameter, it is important to note that its value contains one or more URIs and not IRIs. In some cases it might therefore be necessary to convert between IRIs and URIs as specified in section 3 Relationship between IRIs and URIs of \[\[RFC3987\]\].

Encoding considerations:

Same as `+yaml`.

Security considerations:

See [](#sec).

Interoperability considerations:

See [](#int).

Published specification:

http://www.w3.org/TR/yaml-ld

Applications that use this media type:

Any programming environment that requires the exchange of directed graphs.

Additional information:

Deprecated alias names for this type:

N/A

Magic number(s):

Same as `application/yaml`

File extension(s):

- `.yaml`
- `.yamlld`

Macintosh file type code(s):

Same as `application/yaml`

Windows Clipboard Name:

Same as `application/yaml`

Person & email address to contact for further information:

W3C JSON-LD Working Group <public-json-ld-wg@w3.org>

Intended usage:

Common

Restrictions on usage:

N/A

Author(s):

Roberto Polli, Gregg Kellogg

Change controller:

W3C

## Best Practices

Here, we propose to YAML-LD users a bit of advice which, although optional, might suggest one or two useful thoughts.

Follow JSON-LD best practices …in order to achieve a greater level of reusability, performance, and human friendliness among YAML-LD aware systems. The \[\[json-ld-bp\]\] document is as relevant to YAML-LD as it is to \[\[JSON-LD11\]\].

Do not force users to author contexts Instead, provide pre-built contexts that the user can reference by URL for a majority of common use cases.

YAML-LD is intended to simplify the authoring of Linked Data for a wide range of domain experts; its target audience is not comprised solely of IT professionals. \[\[YAML\]\] is chosen as a medium to minimize syntactic noise, and to keep the authored documents concise and clear. \[\[JSON-LD11\]\] (and hence YAML-LD) Context comprises a special language of its own. A requirement to _author_ such a context would make the domain expert's job much harder, which we, as system architects and developers, should try to avoid.

Use a default context

If most, or all, of a user's documents are based on one particular context, try to make it the default in order to rescue the user from copy-pasting the same technical incantation from one document to another.

For instance, according to \[\[JSON-LD11-API\]\], the \`expand()\` method of a JSON-LD processor accepts an \`expandContext\` argument which can be used to provide a default system context.

Alias JSON-LD keywords If possible, map JSON-LD keywords containing the \`@\` character to keywords that do not contain it.

The \`@\` character is reserved in YAML, and thus requires quoting (or escaping), as in the following example:

The need to quote these keywords has to be learnt, and introduces one more little irregularity to the document author's life. Further, on most keyboard layouts, typing quotes will require \`Shift\`, which reduces typing speed, albeit slightly.

In order to avoid this, the context might introduce custom mappings for JSON-LD keywords — to make authoring more convenient. The exact mapping might vary depending on the domain, but we provide two examples, both published at [json-ld.org](https://json-ld.org):

- [`convenience.jsonld`](https://json-ld.org/contexts/convenience.jsonld) maps `@id` → `id` and so on, removing the `@` character
- [`dollar-convenience.jsonld`](https://json-ld.org/contexts/dollar-convenience.jsonld) maps `@id` → `$id` and so on, replacing `@` with `$`.

Use a Convenience Context

YAML-LD users may use a JSON-LD context provided as part of this specification, or a similar custom context, to improve the authoring experience and readability.

Unfortunately, `@context` keyword cannot be aliased as per JSON-LD specification and will have to stay as-is.

Consider [](#quoted-example)reformatted using the `$`\-convenience context:

Avoid stuffing more than one YAML document into a single \`<script>\` HTML tag. Create one tag per document instead.

Consider the following example.

The YAML specification states in Document Markers section that \`---\`, the document separator sequence, must be at the root level of the document, which means indentation level of 0.

Aside from the document separator, YAML content inside the \`<script>\` block can be indented however the author of the document pleases. The strict rule for indentation of the separator is an important exception.

It is therefore best to avoid nesting YAML streams inside \`<script>\` blocks; instead, create one such block per document.

## Why are comments treated as whitespace?

## Consistency

\[\[?TURTLE\]\] and other Linked Data serializations which support comments

do not provide a means to preserve them when processing and serializing the document in other formats

YAML

requires that parts of the document not reflected by representation graph, such as

- comments
- directives
- mapping key order
- anchor names

must not be used to convey application level information.

## Predictability

Theoretically, we could try harvesting YAML comments into JSON-LD documents. We would define a specific predicate, like `https://json-ld.org/yaml-ld/comment`, and convert every `# My comment` fragment into a `{"yaml-ld:comment": "My comment"}` piece of the JSON-LD document.

This would, however, have the following impacts on implementations:

- They would be more complicated, because most industrially available YAML parsers discard comments on reading YAML data
- They would be less predictable, because order of keys is not preserved in JSON — and therefore, when converting a JSON-LD document back to YAML-LD, comments might be displaced.

## Extended YAML-LD Profile

## Motivation

The YAML-LD specification relies upon YAML to serialize Linked Data to the extent that YAML is compatible with JSON, which simplifies the operation and usage of YAML-LD. However, the [more expressive feature set](#json-vs-yaml) of YAML invites us to represent Linked Data in a more expressive way.

In the cases described above, one of the possible expressive methods is a specific feature of YAML language. To leverage those methods, we propose an **Extended YAML-LD Profile** which will implement all such features.

The Extended Profile is out of scope for the normative part of this specification; we leave it for later versions, pending feedback from the community and new knowledge gained from practical experience of using the basic version of YAML-LD that we will henceforth call **Basic Profile of YAML-LD**.

## Specify node `@type`

When converting JSON-LD to RDF, `@type` translates to one of the following:

- an `rdf:type` edge
- a `datatype` mark for a `Literal` node

Possible ways to specify this in YAML-LD are the following:

- In the `@context`, but there we can only say that the node is an IRI, we cannot specify a particular `rdf:type`
- Using \[\[RDF-SCHEMA\]\] and \[\[OWL2-SYNTAX\]\] based logical reasoning, for instance, via `rdfs:domain` or `rdfs:range` properties
- Inline, using the `@type` keyword
- Using a YAML Tag, as shown below:

                  %TAG !xsd! http://www.w3.org/2001/XMLSchema%23
                  ---
                  "@context": https://schema.org
                  "@id": https://w3.org/yaml-ld/
                  dateModified: !xsd:date 2023-06-26


  Here, `%TAG` declares the `!xsd:` prefix for tags used in the document. YAML treats tags as IRIs, which brings it close to the LD family of data formats. Note that the directives section must be separated from the main document with `---` (a line containing exactly three hyphens).

## Reduce duplication

If a segment of a YAML document has to be repeated more than once, one of the following approaches can be taken:

- Repeat the segment as many times as necessary
- If the segment represents a node, designate it once with a YAML-LD `@id`, and then address it by the given identifier
- Use YAML anchors & aliases as shown in [](#example-with-anchors).

## Approaches

Two alternative approaches have been proposed to implement the Extended profile:

- Extended Internal Representation
- Preprocessor to convert an Extended YAML-LD document to a plain YAML-LD document

## Extended Internal Representation

This approach implies extending the JSON-LD internal representation to allow a more complete expression of native data types within YAML-LD, and allows use of the complete \[\[\[JSON-LD11-API\]\]\] \[\[JSON-LD11-API\]\] Application Programming Interface to manipulate extended YAML-LD documents.

A YAML-LD document complies with the YAML-LD extended profile of this specification if it follows the normative statements from this specification and can be transformed into the JSON-LD extended internal representation, then back to a conforming YAML-LD document, without loss of semantic information.

As \[\[YAML\]\] has well-defined representation requirements, all YAML-LD streams MUST form a well-formed stream and use alias node defined by a previous node with a corresponding anchor; otherwise, a loading-document-failed error has been detected and processing is aborted.

The YAML-LD extended profile allows full use of anchor names and alias nodes subject to the requirements described above in this section.

If the {{JsonLdOptions/processingMode}} API parameter is \`yaml-ld-extended\`, the processing result will be in the extended internal representation.

When processing using the YAML-LD Basic profile, documents MUST NOT contain alias nodes; otherwise, a profile-error error has been detected and processing is aborted.

## Conversion to the Internal Representation

YAML-LD processing is defined by converting YAML to the internal representation and using \[\[\[JSON-LD11-API\]\]\] to process on that representation, after which the representation is converted back to YAML. As information specific to a given YAML document structure is lost in this transformation, much of the specifics of that original representation are therefore lost in that conversion, limiting the ability to fully round-trip a YAML-LD document back to an equivalent representation. Consequently, round-tripping in this context is limited to preservation of the semantic representation of a document, rather than a specific syntactic representation.

For example, YAML has multiple ways to encode an array, YAML block sequences and flow sequences. Both forms describe the same array of two strings.

A YAML block sequence:

A YAML flow sequence:

The conversion process represented here is compatible with the description of "Composing the Representation Graph" from the 3.1.2 Load section of \[\[YAML\]\]. The steps described below for converting to the internal representation operate upon that .

When operating using the YAML-LD Basic profile, it is intended that the common feature provided by most YAML libraries of transforming YAML directly to JSON satisfies the requirements for parsing a YAML-LD file.

As a developer, I want to be able to convert JSON-LD documents to YAML-LD by simply serializing the document using any standard YAML library, So that the resulting YAML is valid YAML-LD, resolving to the same graph as the original JSON-LD.

### Converting a YAML stream

A YAML stream is composed of zero or more YAML documents.

1.  Set |stream content| to an empty array.
2.  If the stream is empty, set |stream content| to an empty array.
3.  Otherwise, if the stream contains a single YAML document, set |stream content| the result of [](#convert-document).
4.  Otherwise: for each |document| in the stream:

    1.  Set |doc| to the result of [](#convert-document)for |document|.
    2.  If |doc| is an array, merge it to the end of |stream content|.
    3.  Otherwise, append |doc| to |stream content|

    This step is inconsistent with other statements about processing each document separately, resulting in some other stream of JSON-LD output (i.e., something like _NDJSOND-LD_). Also, presumably an empty stream would result in either an empty _NDJSON-LD_ document, or an empty \[\[JSON-LD\]\] document.

5.  The conversion result is |stream content|.

Any error reported in a recursive processing step MUST result in the failure of this processing step.

### Converting a YAML document

From the YAML grammar, a YAML document MAY be preceded by a Document Prefix and/or a set of directives followed by a YAML bare document, which is composed of a single node.

1.  Create an empty |named nodes| map which will be used to associate each alias node with the node having the corresponding node anchor.
2.  Set |document content| to the result of processing the node associated with the YAML bare document, using the appropriate conversion step defined in this section. If that node is not one of the following, a loading-document-failed error has been detected and processing is aborted.

    - block sequence,
    - block mapping, or
    - flow sequence,
    - flow mapping, or

    A node may be of another type, but this is incompatilbe with JSON-LD, where the top-most node must be either an array or map.

3.  The conversion result is |document content|.

Any error reported in a recursive processing step MUST result in the failure of this processing step.

### Converting a YAML sequence

Both block sequences and flow sequences are directly aligned with an array in the internal representation.

1.  Set |sequence content| to an empty array.
2.  If the sequence has a node anchor, add a reference from the anchor name to the sequence in the |named nodes| map.
3.  For each node |n| in the sequence, append the result of processing |n| to |sequence content| using the appropriate conversion step.
4.  The conversion result is |sequence content|.

Any error reported in a recursive processing step MUST result in the failure of this processing step.

### Converting a YAML mapping

Both block mappings and flow mappings are directly aligned with a map in the internal representation.

1.  Set |mapping content| to an empty map.
2.  Otherwise, if the mapping has a node anchor, add a reference from the anchor name to the mapping in the |named nodes| map.
3.  For each |entry| in the mapping composed of a key/value pair:
    1.  Set |key| and |value| to the result of processing |entry| using the appropriate conversion step.
    2.  If |key| is not a string, a mapping-key-error error has been detected and processing MUST be aborted.
    3.  Add a new entry to |mapping content| using |key| and |value|.
4.  The conversion result is |mapping content|.

Any error reported in a recursive processing step MUST result in the failure of this processing step.

### Converting a YAML scalar

1.  If the {{JsonLdOptions/processingMode}} option is \`yaml-ld-extended\`, and node |n| has a node tag |t|, |n| is mapped as follows:
    1.  If |t| resolves with a prefix of \`tag:yaml.org.2002:\`, the conversion result is mapped through the YAML Core Schema.
    2.  Otherwise, if |t| resolves with a prefix of \`https://www.w3.org/ns/i18n#\`, and the suffix **does not** contain an underscore (\`"\_"\`), the conversion result is a language-tagged string with value taken from |n|, and a language tag taken from the suffix of |t|.

        Node tags including an underscore (\`"\_"\`), such as \`i18n:ar-eg_rtl\` describe a combination of language and text direction. See The \`i18n\` Namespace in \[\[JSON-LD11\]\].

    3.  Otherwise, the conversion result is an RDF literal with value taken from |n| and datatype IRI taken from |t|.
2.  Otherwise, the conversion result is mapped through the YAML Core Schema.

Implementations may retain the representation as an YAML Integer, or YAML Floating Point, but a JSON-LD processor must treat them uniformly as a number, although the specific type of number value SHOULD be retained for round-tripping.

### Converting a YAML alias node

The conversion result is the value of the entry in the |named nodes| map having the node entry. If none exist, the document is invalid, and processing MUST end in failure.

If an alias node is encountered when processing the YAML representation graph and the {{JsonLdOptions/processingMode}} option is not equal to \`yaml-ld-extended\`, the YAML-LD Basic profile has been selected. A profile-error error has been detected and processing MUST be aborted.

If a cycle is detected, a processing error MUST be returned, and processing aborted.

## Conversion to YAML

The conversion process from the internal representation involves turning that representation back into a YAML representation graph and relies on the description of "Serializing the Representation Graph" from the 3.1.1 Dump section of \[\[YAML\]\] for the final serialization.

As the internal representation is rooted by either an array or a map, the process of transforming the internal representation to YAML begins by preparing an empty representation graph which will be rooted with either a YAML mapping or YAML sequence.

Although outside of the scope of this specification, processors MAY use YAML directives, including TAG directives, and Document markers, as appropriate for best results. Specifically, if the {{JsonLdOptions/processingMode}} API parameter is \`yaml-ld-extended\`, the document SHOULD use the \`%YAML\` directive with version set to at least \`1.2\`. To improve readability and reduce document size, the document MAY use a \`%TAG\` directive appropriate for RDF literals contained within the representation.

The use of \`%TAG\` directives in YAML-LD is similar to the use of the \`PREFIX\` directive in \[\[?Turtle\]\] or the general use of terms as prefixes to create Compact IRIs in \[\[JSON-LD11\]\]: they not change the meaning of the encoded scalars.

Although allowed within the YAML Grammar, some current YAML parsers do not allow the use of \`"#"\` within a tag URI. Substituting the \`"%23"\` escape is a workaround for this problem, that will hopefully become unnecessary as implementations are updated.

A concrete proposal in that direction would be to use a tag at the top-level of any "idiomatic" YAML-LD document, applying to the whole object/array that makes the document.

It might also include a version to identify the specification that it relates to, allowing for version announcement that could be used for future-proofing.

The following block is one example:

        !yaml-ld
        $context: http://schema.org
        $type: Person
        name: Pierre-Antoine Champin


See [](#example-serialized-representation-of-the-extended-internal-representation)for an example of serializing the extended internal representation.

### Converting From the Internal Representation

This algorithm describes the steps to convert each element from the internal representation into corresponding YAML nodes by recursively processing each element |n|.

1.  If |n| is an array, the conversion result is a YAML sequence with child nodes of the sequence taken by converting each value of |n| using this algorithm.
2.  Otherwise, if |n| is an map, the conversion result is a YAML mapping with keys and values taken by converting each key/value pair of |n| using this algorithm.
3.  Otherwise, if |n| is an RDF literal:
    1.  If the datatype IRI of |n| is \`xsd:string\`, the conversion is a YAML scalar with the value taken from that value of |n|.
    2.  Otherwise, if |n| is a language-tagged string, the conversion is a YAML scalar with the value taken from that value of |n| and a node tag constructed by appending that language tag to \`https://www.w3.org/ns/i18n#\`.
    3.  Otherwise, the conversion is a YAML scalar with the value taken from that value of |n| and a node tag taken from the datatype IRI of |n|.
4.  Otherwise, if |n| is a number, the conversion result is a YAML scalar with the value taken from |n|.
5.  Otherwise, if |n| is a boolean, the conversion result is a YAML scalar with the value either \`true\` or \`false\` based on the value of |n|.
6.  Otherwise, if |n| is null, the conversion result is a YAML scalar with the value \`null\`.
7.  Otherwise, conversion result is a YAML scalar with the value taken from |n|.

## Application Profiles

This section identifies two application profiles for operating with YAML-LD:

- the YAML-LD Basic profile, and
- the YAML-LD Extended profile.

Application profiles allow publishers to use YAML-LD either for maximum interoperability, or for maximum expressivity. The YAML-LD Basic profile provides for complete round-tripping between YAML-LD documents and JSON-LD documents. The YAML-LD extended profile allows for fuller use of YAML features to enhance the ability to represent a larger number of native datatypes and reduce document redundancy.

Application profiles can be set using the {{JsonLdProcessor}} API interface, as well as an HTTP request profile (see [](#iana)).

### YAML-LD Basic Profile

The YAML-LD Basic profile is based on the YAML Core Schema, which interprets only a limited set of node tags. YAML scalars with node tags outside of the defined range SHOULD be avoided and MUST be converted to the closest scalar type from the YAML Core Schema, if found. See [](#convert-scalar)for specifics.

Although YAML supports several additional encodings, YAML-LD documents in the YAML-LD Basic Profile MUST NOT use encodings other than UTF-8.

Keys used in a YAML mapping MUST be strings.

Although YAML-LD documents MAY include node anchors, documents MUST NOT use alias nodes.

A YAML stream MUST include only a single YAML document, as the JSON-LD internal representation only supports a single document model.

### YAML-LD Extended Profile

The YAML-LD extended profile extends the YAML Core Schema, allowing node tags to specify RDF literals by using a JSON-LD extended internal representation capable of directly representing RDF literals.

As with the YAML-LD Basic profile, YAML-LD documents in the YAML-LD extended profile MUST NOT use encodings other than UTF-8.

As with the YAML-LD Basic profile, keys used in a YAML mapping MUST be strings.

YAML-LD docucments MAY use alias nodes, as long as dereferencing these aliases does not result in a loop.

As with the YAML-LD Basic profile, a YAML stream MUST include only a single YAML document, as the JSON-LD extended internal representation only supports a single document model.

Consier something like \`!id\` as a local tag to denote IRIs.

#### The JSON-LD Extended Internal Representation

This specification defines the JSON-LD extended internal representation , an extension of the JSON-LD internal representation.

In addition to maps, arrays, and strings, the internal representation allows native representation of numbers, boolean values, and nulls. The extended internal representation allows for native representation of RDF literals, both with a datatype IRI, and language-tagged strings.

When transforming from the extended internal representation to the internal representation — for example when serializing to JSON or to the YAML-LD Basic profile — implementations MUST transform RDF literals to the closest native representation of the internal representation:

- Literals with datatype \`xsd:boolean\` are transformed to either \`true\` or \`false\`,
- Literals with datatype \`xsd:decimal\`, \`xsd:double\`, \`xsd:float\`, or derived datatypes, are transformed to a native number,
- All other literals are transformed to a native string.

An alternative would be to transform such literals to JSON-LD value objects, and we may want to provide a means of transforming between the internal representation and extended internal representation using value objects, but this treatment is consistent with \[\[YAML\]\] Core Schema Tag Resolution.

## The Application Programming Interface

This specification extends the \[\[\[JSON-LD11-API\]\]\] \[\[JSON-LD11-API\]\] Application Programming Interface and the \[\[\[JSON-LD11-FRAMING\]\]\] \[\[JSON-LD11-FRAMING\]\] Application Programming Interface to manage the serialization and deserialization of \[\[YAML\]\] and to enable an option for setting the YAML-LD extended profile.

### JsonLdProcessor

The JSON-LD Processor interface is the high-level programming structure that developers use to access the JSON-LD transformation methods. The updates below is an experimental extension of the {{JsonLdProcessor}} interface defined in the JSON-LD 1.1 API \[\[JSON-LD11-API\]\] to serialize output as YAML rather than JSON.

{{JsonLdProcessor/compact()}}

Updates step 10 of the {{JsonLdProcessor/compact()}} algorithm to serialize the the result as YAML rather than JSON as defined in [](#conversion-to-yaml).

{{JsonLdProcessor/expand()}}

Updates step 9 of the {{JsonLdProcessor/expand()}} algorithm to serialize the the result as YAML rather than JSON as defined in [](#conversion-to-yaml).

{{JsonLdProcessor/flatten()}}

Updates step 7 of the {{JsonLdProcessor/flatten()}} algorithm to serialize the the result as YAML rather than JSON as defined in [](#conversion-to-yaml).

Updates step 22 of the frame() algorithm to serialize the the result as YAML rather than JSON as defined in [](#conversion-to-yaml).

{{JsonLdProcessor/fromRdf()}}

Updates step 3 of the {{JsonLdProcessor/fromRdf()}} algorithm to serialize the the result as YAML rather than JSON as defined in [](#conversion-to-yaml).

Updates the RDF to Object Conversion algorithm before step 2.6 as follows:

> Otherwise, if the {{JsonLdOptions/useNativeTypes}} flag is set, the {{JsonLdOptions/processingMode}} parameter is \`yaml-ld-extended\`, and the datatype IRI of |value| is not \`xsd:string\`:
>
> 1.  If |value| is a language-tagged string set |converted value| to a new RDF literal composed of the lexical form of |value| and datatype IRI composed of \`https://www.w3.org/ns/i18n#\` followed by the language tag of |value|.
> 2.  Otherwise, et |converted value| to |value|.

{{JsonLdProcessor/toRdf()}}

Updates the Object to RDF Conversion algorithm before step 10 as follows:

> 1.  Otherwise, if |value| is an RDF literal, |value| is left unmodified. This will only be the case when processing a value from an extended internal representation.

### JsonLdOptions

The {{JsonLdOptions}} type is used to pass various options to the {{JsonLdProcessor}} methods.

This specification reuses the following option defined in \[\[JSON-LD11-API\]\]:

processingMode

Possible values are detailed in the table below.

Value

Meaning

`json-ld-1.0`

Processor MUST raise a profile-error, as JSON-LD 1.0 algorithms are not supported by YAML-LD.

Not Provided, or `json-ld-1.1`

The document conforms to YAML-LD Basic profile.

`yaml-ld-extended`

The document MUST be processed in conformance with YAML-LD extended profile.

Other values starting with `yaml-ld`

Reserved for future versions of this specification.

Other Values

Can be used by YAML-LD processors to enable custom processing algorithms.

When YAML-LD extended profile is used for serializing the internal representation (or extended internal representation) into a YAML representation graph:

- YAML-LD extended profile allows the use of node tags when serializing RDF literal values having datatypes other than \`xsd:string\` or language-tagged strings as scalar values.
- Otherwise, it serializes RDF literal values to the closest scalar representation from the YAML Core Schema.

When used for the {{documentLoader}}, it causes documents of type \`application/ld+yaml\` to be parsed into a YAML representation graph and generates an internal representation (or extended internal representation):

- YAML-LD extended profile creates an extended internal representation and transforms YAML scalar values having node tags — outside those allowed for the YAML Core Schema — to RDF literals.
- Otherwise, it drops any node tags

### Remote Document and Context Retrieval

This section describes an update to the built-in {{LoadDocumentCallback}} to load YAML streams and documents into the internal representation, or into the extended internal representation if the {{JsonLdOptions/processingMode}} parameter is \`yaml-ld-extended\`.

The {{LoadDocumentCallback}} algorithm in \[\[JSON-LD11-API\]\] is updated as follows:

- Step 2 is updated to prefer Content-Type \`application/ld+yaml\`, followed by \`application/yaml\`, followed by the other specified Content-Types.
- After step 5, add the following processing step: Otherwise, if the retrieved resource's Content-Type is either \`application/yaml\` or any media type with a \`+yaml\` suffix as defined in \[\[RFC6839\]\] transform |document| to the internal representation (or extended internal representation) as described in [](#conversion-to-ir). Additionally, if the {{RemoteDocument/profile}} parameter includes \`http://www.w3.org/ns/json-ld#extended\`, set the {{JsonLdOptions/processingMode}} option to \`yaml-ld-extended\`.

These updates are intended to be compatible with other updates to the {{LoadDocumentCallback}}, such as Process HTML as defined in \[\[JSON-LD11-API\]\].

#### YamlLdErrorCode

The YamlLdErrorCode represents the collection of valid YAML-LD error codes, which extends the {{JsonLdErrorCode}} definitions.

          enum YamlLdErrorCode {
            "invalid-encoding",
            "mapping-key-error",
            "profile-error"
          };


invalid-encoding

The character encoding of an input is invalid.

mapping-key-error

A YAML mapping key was found that was not a string.

profile-error

The parsed YAML document contains features incompatible with the specified profile.

## Implementations

TODO: Implementations for Extended Internal Representation.

## Convert Extended YAML-LD to Basic YAML-LD and back

This approach is simpler than the Extended Internal Representation because it does not require any changes to the internal structures of existing JSON-LD libraries.

Instead, we implement two API functions:

`extended_to_basic(extended_document: YAML-LD) → YAML-LD`

- Converts the document to Basic YAML-LD form

`basic_to_extended(basic_document: YAML-LD) → YAML-LD`

- Converts YAML-LD → JSON
- Performs JSON-LD expansion → the resulting JSON-LD document
- Converts Expanded JSON-LD document back to YAML-LD
- Converts it to the Extended form, making use of YAML-LD features to express the document more concisely.

You won't typically need to perform these steps manually because libraries such as `rdflib` will take care of them under the covers, but it can help with troubleshooting and optimization to know what's going on. So, you start with YAML, convert it to JSON, perform JSON-LD Expansion, convert that to YAML-LD, and do any necessary _basic → extended_ or _extended → basic_ conversion on the YAML-LD. Alternatively, your library might do YAML-LD expansion directly on the initial YAML document, and then do any necessary _basic → extended_ or _extended → basic_ conversion on the YAML-LD.

Both of these functions recursively process the source document. Every branch and leaf are copied as is, unless they match one of the following cases.

Generally, these two equalities **do not** hold:

- `extended_to_basic(basic_to_extended(document)) = document`
- `basic_to_extended(extended_to_basic(document)) = document`

When the extended → basic conversion resolves YAML tags we no longer know where the original document used tags and where it used `@type` calls. Thus, information is lost.

Both of these functions lose information about anchors and references because they're resolved by the YAML processor underlying the implementation.

`extended_to_basic`

`basic_to_extended`

YAML Tags

[Convert](#tags-to-types) YAML `!tags` → `@type` JSON-LD keywords

(nothing)

Anchors and aliases

[Resolve](#resolve-anchors-aliases) anchors and aliases

(nothing)

Comments

Keep as-is

Remove  
(Due to JSON-LD & Expansion.)

## YAML `!tags` → `@type` declarations

              %TAG !xsd! http://www.w3.org/2001/XMLSchema%23
              ---
              "@context": https://schema.org
              "@id": https://github.com/gkellogg
              "@type": Person
              name: !xsd!string Gregg Kellogg
              birthDate: !xsd!date 1970-01-01


                  "@context":
                    - "@import": https://schema.org
                    - xsd: "http://www.w3.org/2001/XMLSchema#"
                  "@id": https://github.com/gkellogg
                  "@type": Person
                  name: Gregg Kellogg
                  birthDate:
                    "@value": 1970-01-01
                    "@type": xsd:date


## `&anchors` and `*aliases`

Substitute every `*alias` with the content of the `&anchor` alias references to. This is standard behavior of YAML tools and libraries.

### Fragment identifiers

Fragment identifiers used with [application/ld+yaml](#application-ld-yaml) are treated as in RDF syntaxes, as per RDF 1.1 Concepts and Abstract Syntax \[\[RDF11-CONCEPTS\]\] and do not follow the process defined for `application/yaml`.

Perhaps more on fragment identifiers from [Issue 31](https://github.com/json-ld/yaml-ld/issues/31).
