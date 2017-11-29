var mongooose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data = [
        {
            name: "Cloud's Rest", 
            image: "https://farm5.staticflickr.com/4137/4812576807_8ba9255f38.jpg",
            description: "Spicy jalapeno bacon ipsum dolor amet aliquip beef ribs labore strip steak ex salami sunt flank pariatur est qui excepteur. Rump dolore jerky, porchetta beef ribs esse exercitation est officia duis shoulder aliquip. Turkey bresaola kevin nulla drumstick excepteur, cillum aliquip do sunt ham rump andouille reprehenderit. Tongue corned beef strip steak magna."
        },
         {
            name: "Bears's Den", 
            image: "https://farm5.staticflickr.com/4153/4835814837_feef6f969b.jpg",
            description: "Spicy jalapeno bacon ipsum dolor amet aliquip beef ribs labore strip steak ex salami sunt flank pariatur est qui excepteur. Rump dolore jerky, porchetta beef ribs esse exercitation est officia duis shoulder aliquip. Turkey bresaola kevin nulla drumstick excepteur, cillum aliquip do sunt ham rump andouille reprehenderit. Tongue corned beef strip steak magna."
        },
         {
            name: "All Alone In The Woods", 
            image: "https://farm2.staticflickr.com/1363/1342367857_2fd12531e7.jpg",
            description: "Spicy jalapeno bacon ipsum dolor amet aliquip beef ribs labore strip steak ex salami sunt flank pariatur est qui excepteur. Rump dolore jerky, porchetta beef ribs esse exercitation est officia duis shoulder aliquip. Turkey bresaola kevin nulla drumstick excepteur, cillum aliquip do sunt ham rump andouille reprehenderit. Tongue corned beef strip steak magna."
        }
    ];

function seedDB(){
    // remove all campgrounds
    Campground.remove({}, function(err) {
        if(err){
            console.log("error");
        }
        console.log("Removed all from DB");
        // add a few campgrounds
        data.forEach(function(seed){
            Campground.create(seed, function(err, campground) {
                if(err){
                    console.log(err);
                } else {
                    console.log("added a campground");
                    //add a few comments
                    Comment.create(
                        {
                            text: "This place is great but I had no cell signal",
                            author: "Homer"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                campground.comments.push(comment);
                                campground.save();
                                console.log("created a comment");
                            }
                            
                        });
                }
            });
        });
    });
}

module.exports = seedDB;
