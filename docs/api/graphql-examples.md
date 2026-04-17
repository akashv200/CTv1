# GraphQL Examples

Endpoint: `POST /graphql`

## Query products

```graphql
query Products {
  products {
    productId
    productName
    domain
    authenticityScore
    blockchainTxHash
  }
}
```

## Query product journey

```graphql
query Journey($productId: String!) {
  productJourney(productId: $productId) {
    product {
      productId
      productName
      authenticityScore
    }
    checkpoints {
      checkpointType
      location
      temperature
      createdAt
    }
  }
}
```

## Query latest checkpoints

```graphql
query Latest {
  latestCheckpoints(limit: 15) {
    productId
    checkpointType
    location
    blockchainTxHash
  }
}
```
