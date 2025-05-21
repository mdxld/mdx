import * as S from 'schema-dts';

/**  
 * Walk any object type `T`, and
 * whenever a key is `"@type"`, re-emit it as `"$type"`.
 * This utility transforms schema-dts types to use $-prefixed keys
 * instead of @-prefixed keys for compatibility with YAML and ease of use in JS/TS.
 */
type Dollarize<T> =
  T extends object
    ? { [K in keyof T as K extends '@type' ? '$type' : K]:
          Dollarize<T[K]> }
    : T;

export type Thing = Dollarize<S.Thing>;
export type Person = Dollarize<S.Person>;
export type Organization = Dollarize<S.Organization>;
export type CreativeWork = Dollarize<S.CreativeWork>;
export type Article = Dollarize<S.Article>;
export type BlogPosting = Dollarize<S.BlogPosting>;
export type WebPage = Dollarize<S.WebPage>;
export type WebSite = Dollarize<S.WebSite>;
export type Product = Dollarize<S.Product>;
export type Event = Dollarize<S.Event>;
export type Place = Dollarize<S.Place>;
export type LocalBusiness = Dollarize<S.LocalBusiness>;
export type Review = Dollarize<S.Review>;
export type Rating = Dollarize<S.Rating>;
export type Offer = Dollarize<S.Offer>;
export type AggregateRating = Dollarize<S.AggregateRating>;
export type ImageObject = Dollarize<S.ImageObject>;
export type VideoObject = Dollarize<S.VideoObject>;
export type AudioObject = Dollarize<S.AudioObject>;

export namespace $ {
  export type Thing = Dollarize<S.Thing>;
  export type Person = Dollarize<S.Person>;
  export type Organization = Dollarize<S.Organization>;
  export type CreativeWork = Dollarize<S.CreativeWork>;
  
  export type Article = Dollarize<S.Article>;
  export type BlogPosting = Dollarize<S.BlogPosting>;
  export type WebPage = Dollarize<S.WebPage>;
  export type WebSite = Dollarize<S.WebSite>;
  export type Book = Dollarize<S.Book>;
  export type Course = Dollarize<S.Course>;
  export type Movie = Dollarize<S.Movie>;
  export type MusicRecording = Dollarize<S.MusicRecording>;
  export type Recipe = Dollarize<S.Recipe>;
  export type SoftwareApplication = Dollarize<S.SoftwareApplication>;
  
  export type Product = Dollarize<S.Product>;
  export type Offer = Dollarize<S.Offer>;
  export type AggregateOffer = Dollarize<S.AggregateOffer>;
  
  export type Event = Dollarize<S.Event>;
  export type Place = Dollarize<S.Place>;
  export type LocalBusiness = Dollarize<S.LocalBusiness>;
  export type Restaurant = Dollarize<S.Restaurant>;
  export type Hotel = Dollarize<S.Hotel>;
  
  export type Review = Dollarize<S.Review>;
  export type Rating = Dollarize<S.Rating>;
  export type AggregateRating = Dollarize<S.AggregateRating>;
  
  export type MediaObject = Dollarize<S.MediaObject>;
  export type ImageObject = Dollarize<S.ImageObject>;
  export type VideoObject = Dollarize<S.VideoObject>;
  export type AudioObject = Dollarize<S.AudioObject>;
  
  export type Action = Dollarize<S.Action>;
  export type SearchAction = Dollarize<S.SearchAction>;
  export type BuyAction = Dollarize<S.BuyAction>;
  
  export type ItemList = Dollarize<S.ItemList>;
  export type BreadcrumbList = Dollarize<S.BreadcrumbList>;
  export type ListItem = Dollarize<S.ListItem>;
  export type ContactPoint = Dollarize<S.ContactPoint>;
  export type PostalAddress = Dollarize<S.PostalAddress>;
  export type GeoCoordinates = Dollarize<S.GeoCoordinates>;
  export type OpeningHoursSpecification = Dollarize<S.OpeningHoursSpecification>;
  export type PriceSpecification = Dollarize<S.PriceSpecification>;
  export type QuantitativeValue = Dollarize<S.QuantitativeValue>;
  
  export type Graph = Dollarize<S.Graph>;
  export type WithContext<T extends S.Thing> = Dollarize<S.WithContext<T>>;
  
  export type Text = S.Text;
  export type URL = S.URL;
  export type DateTime = S.DateTime;
  export type Date = S.Date;
  export type Time = S.Time;
  export type Boolean = S.Boolean;
  export type Number = S.Number;
  export type Integer = S.Integer;
  export type Float = S.Float;
  export type XPathType = S.XPathType;
  export type CssSelectorType = S.CssSelectorType;
}

export { S as SchemaOrg };
