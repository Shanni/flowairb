import FlowairbV2 from "../../contracts/FlowairbV2.cdc"

// This script returns the details for a listing within a storefront

pub fun main(address: Address, listingResourceID: UInt64): FlowairbV2.ListingDetails {
    let account = getAccount(address)

    let storefrontRef = account
        .getCapability<&FlowairbV2.Storefront{FlowairbV2.StorefrontPublic}>(
            FlowairbV2.StorefrontPublicPath
        )
        .borrow()
        ?? panic("Could not borrow public storefront from address")

    let listing = storefrontRef.borrowListing(listingResourceID: listingResourceID)
        ?? panic("No item with that ID")
    
    return listing.getDetails()
}
