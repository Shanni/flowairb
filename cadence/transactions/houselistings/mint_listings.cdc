import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import HouseListings from "../../contracts/HouseListings.cdc"
import MetadataViews from "../../contracts/MetadataViews.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"

// This transction uses the NFTMinter resource to mint a new NFT.
//
// It must be run with the account that has the minter resource
// stored at path /storage/NFTMinter.

transaction(
    recipient: Address, 
    kind: UInt8, 
    rarity: UInt8, 
    cuts: [UFix64],
    royaltyDescriptions: [String],
    royaltyBeneficiaries: [Address] 
) {

    // local variable for storing the minter reference
    let minter: &HouseListings.NFTMinter

    /// Reference to the receiver's collection
    let recipientCollectionRef: &{NonFungibleToken.CollectionPublic}

    /// Previous NFT ID before the transaction executes
    let mintingIDBefore: UInt64

    prepare(signer: AuthAccount) {
        self.mintingIDBefore = HouseListings.totalSupply

        // Borrow a reference to the NFTMinter resource in storage
        self.minter = signer.borrow<&HouseListings.NFTMinter>(from: HouseListings.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")

        // Borrow the recipient's public NFT collection reference
        self.recipientCollectionRef = getAccount(recipient)
            .getCapability(HouseListings.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")
    }

    execute {
        let kindValue = HouseListings.Kind(rawValue: kind) ?? panic("invalid kind")
        let rarityValue = HouseListings.Rarity(rawValue: rarity) ?? panic("invalid rarity")

        // TODO: Add royalty feature to KI using beneficiaries, cuts, and descriptions. At the moment, we don't provide royalties with KI, so this will be an empty list.
        let royalties: [MetadataViews.Royalty] = []

        // mint the NFT and deposit it to the recipient's collection
        self.minter.mintNFT(
            recipient: self.recipientCollectionRef,
            kind: kindValue,
            rarity: rarityValue,
            royalties: royalties
        )
    }

    post {
        self.recipientCollectionRef.getIDs().contains(self.mintingIDBefore): "The next NFT ID should have been minted and delivered"
        HouseListings.totalSupply == self.mintingIDBefore + 1: "The total supply should have been increased by 1"
    }
}
