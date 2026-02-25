const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? undefined
    : {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      },
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    // Drop table if it exists to ensure clean structure
    await client.query(`DROP TABLE IF EXISTS recipes`);

    await client.query(`
      CREATE TABLE recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients TEXT[] NOT NULL,
        instructions TEXT[] NOT NULL,
        cooking_time INTEGER NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        servings INTEGER DEFAULT 4,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        liked_at TIMESTAMP
      );
    `);
    console.log("Tables created successfully");
  } finally {
    client.release();
  }
};

const seedData = async () => {
  const client = await pool.connect();
  try {
    // Table is already clean since we dropped and recreated it

    const recipes = [
      {
        title: "Spaghetti Carbonara",
        description:
          "A classic Italian pasta dish with eggs, cheese, and pancetta",
        ingredients: [
          "400g spaghetti",
          "200g pancetta or guanciale",
          "4 large eggs",
          "100g Pecorino Romano cheese",
          "100g Parmigiano Reggiano",
          "Black pepper",
          "Salt",
        ],
        instructions: [
          "Bring a large pot of salted water to boil and cook spaghetti according to package directions",
          "While pasta cooks, cut pancetta into small cubes and cook in a large skillet until crispy",
          "In a bowl, whisk together eggs, grated cheeses, and black pepper",
          "Drain pasta, reserving 1 cup of pasta water",
          "Add hot pasta to the skillet with pancetta, remove from heat",
          "Quickly stir in egg mixture, adding pasta water as needed to create a creamy sauce",
          "Serve immediately with extra cheese and black pepper",
        ],
        cooking_time: 20,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400",
      },
      {
        title: "Chicken Tikka Masala",
        description: "Creamy and flavorful Indian curry with tender chicken",
        ingredients: [
          "800g chicken breast, cubed",
          "2 tbsp tikka masala paste",
          "400ml coconut milk",
          "400g canned tomatoes",
          "1 onion, diced",
          "3 cloves garlic, minced",
          "1 inch ginger, grated",
          "2 tbsp vegetable oil",
          "Fresh cilantro",
          "Basmati rice",
        ],
        instructions: [
          "Marinate chicken in tikka masala paste for 30 minutes",
          "Heat oil in a large pan and cook chicken until browned, set aside",
          "In the same pan, sauté onion, garlic, and ginger until soft",
          "Add tomatoes and cook for 5 minutes",
          "Return chicken to pan, add coconut milk and simmer for 20 minutes",
          "Garnish with fresh cilantro and serve with basmati rice",
        ],
        cooking_time: 45,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
      },
      {
        title: "Caesar Salad",
        description: "Fresh and crispy salad with homemade dressing",
        ingredients: [
          "2 heads romaine lettuce",
          "1/2 cup parmesan cheese",
          "1/2 cup croutons",
          "2 anchovy fillets",
          "2 cloves garlic",
          "1 egg yolk",
          "2 tbsp lemon juice",
          "1/4 cup olive oil",
          "Black pepper",
          "Salt",
        ],
        instructions: [
          "Wash and chop romaine lettuce into bite-sized pieces",
          "Make dressing by whisking together egg yolk, lemon juice, garlic, and anchovies",
          "Slowly drizzle in olive oil while whisking to create an emulsion",
          "Toss lettuce with dressing, parmesan cheese, and croutons",
          "Season with salt and black pepper to taste",
        ],
        cooking_time: 15,
        difficulty: "Easy",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
      },
      {
        title: "Beef Tacos",
        description: "Flavorful ground beef tacos with fresh toppings",
        ingredients: [
          "500g ground beef",
          "8 taco shells",
          "1 onion, diced",
          "2 cloves garlic, minced",
          "2 tbsp taco seasoning",
          "1 cup shredded lettuce",
          "1 cup diced tomatoes",
          "1/2 cup shredded cheese",
          "Sour cream",
          "Salsa",
        ],
        instructions: [
          "Brown ground beef in a large skillet over medium heat",
          "Add diced onion and garlic, cook until softened",
          "Stir in taco seasoning and cook for 2 minutes",
          "Warm taco shells in the oven or microwave",
          "Fill shells with beef mixture and top with lettuce, tomatoes, cheese, sour cream, and salsa",
        ],
        cooking_time: 25,
        difficulty: "Easy",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
      },
      {
        title: "Chocolate Chip Cookies",
        description: "Classic homemade chocolate chip cookies",
        ingredients: [
          "2 1/4 cups all-purpose flour",
          "1 cup butter, softened",
          "3/4 cup granulated sugar",
          "3/4 cup brown sugar",
          "2 large eggs",
          "1 tsp vanilla extract",
          "1 tsp baking soda",
          "1/2 tsp salt",
          "2 cups chocolate chips",
        ],
        instructions: [
          "Preheat oven to 375°F (190°C)",
          "Cream together butter and sugars until light and fluffy",
          "Beat in eggs and vanilla extract",
          "In a separate bowl, whisk together flour, baking soda, and salt",
          "Gradually mix dry ingredients into wet ingredients",
          "Stir in chocolate chips",
          "Drop rounded tablespoons of dough onto baking sheets",
          "Bake for 9-11 minutes until golden brown",
        ],
        cooking_time: 30,
        difficulty: "Easy",
        servings: 24,
        image_url:
          "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400",
      },
      {
        title: "Grilled Salmon",
        description: "Perfectly grilled salmon with herbs and lemon",
        ingredients: [
          "4 salmon fillets",
          "2 tbsp olive oil",
          "2 lemons",
          "4 sprigs fresh dill",
          "4 sprigs fresh thyme",
          "Salt and pepper",
          "Garlic powder",
        ],
        instructions: [
          "Preheat grill to medium-high heat",
          "Pat salmon fillets dry with paper towels",
          "Brush with olive oil and season with salt, pepper, and garlic powder",
          "Place salmon on grill, skin-side down",
          "Cook for 4-5 minutes per side until fish flakes easily",
          "Garnish with fresh herbs and lemon wedges",
        ],
        cooking_time: 20,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
      },
      {
        title: "Vegetable Stir Fry",
        description: "Quick and healthy vegetable stir fry",
        ingredients: [
          "2 cups broccoli florets",
          "1 bell pepper, sliced",
          "1 carrot, julienned",
          "1 cup snap peas",
          "2 tbsp soy sauce",
          "1 tbsp sesame oil",
          "2 cloves garlic, minced",
          "1 inch ginger, grated",
          "2 tbsp vegetable oil",
          "Sesame seeds",
        ],
        instructions: [
          "Heat vegetable oil in a wok or large skillet over high heat",
          "Add garlic and ginger, stir-fry for 30 seconds",
          "Add vegetables and stir-fry for 3-4 minutes",
          "Add soy sauce and sesame oil",
          "Continue cooking for 2 minutes until vegetables are crisp-tender",
          "Garnish with sesame seeds and serve hot",
        ],
        cooking_time: 15,
        difficulty: "Easy",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
      },
      {
        title: "Margherita Pizza",
        description: "Classic Italian pizza with tomato and mozzarella",
        ingredients: [
          "1 pizza dough",
          "1/2 cup tomato sauce",
          "200g fresh mozzarella",
          "Fresh basil leaves",
          "2 tbsp olive oil",
          "Salt and pepper",
        ],
        instructions: [
          "Preheat oven to 500°F (260°C) with a pizza stone if available",
          "Roll out pizza dough on a floured surface",
          "Spread tomato sauce evenly over the dough",
          "Add torn mozzarella pieces",
          "Drizzle with olive oil and season with salt and pepper",
          "Bake for 12-15 minutes until crust is golden",
          "Top with fresh basil leaves before serving",
        ],
        cooking_time: 25,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
      },
      {
        title: "Chicken Noodle Soup",
        description: "Comforting homemade chicken noodle soup",
        ingredients: [
          "1 whole chicken",
          "2 carrots, chopped",
          "2 celery stalks, chopped",
          "1 onion, diced",
          "4 cups chicken broth",
          "2 cups egg noodles",
          "2 tbsp olive oil",
          "Salt and pepper",
          "Fresh parsley",
        ],
        instructions: [
          "In a large pot, heat olive oil and sauté onion, carrots, and celery",
          "Add chicken broth and bring to a boil",
          "Add chicken and simmer for 1 hour until chicken is cooked through",
          "Remove chicken, shred meat, and return to pot",
          "Add noodles and cook for 8-10 minutes",
          "Season with salt and pepper, garnish with parsley",
        ],
        cooking_time: 90,
        difficulty: "Medium",
        servings: 6,
        image_url:
          "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
      },
      {
        title: "Chocolate Lava Cake",
        description: "Decadent chocolate lava cakes with molten center",
        ingredients: [
          "4 oz dark chocolate",
          "1/2 cup butter",
          "2 eggs",
          "2 egg yolks",
          "1/4 cup sugar",
          "1/4 cup flour",
          "1/4 tsp salt",
          "Butter for ramekins",
          "Cocoa powder for dusting",
        ],
        instructions: [
          "Preheat oven to 425°F (220°C)",
          "Butter and dust 4 ramekins with cocoa powder",
          "Melt chocolate and butter together",
          "Whisk eggs, egg yolks, and sugar until pale",
          "Fold in melted chocolate mixture",
          "Gently fold in flour and salt",
          "Divide batter among ramekins",
          "Bake for 12-14 minutes until edges are set but center is soft",
        ],
        cooking_time: 30,
        difficulty: "Hard",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
      },
      {
        title: "Quinoa Buddha Bowl",
        description:
          "Healthy vegetarian bowl with quinoa and roasted vegetables",
        ingredients: [
          "1 cup quinoa",
          "1 sweet potato, cubed",
          "1 cup chickpeas",
          "1 avocado",
          "1 cup kale",
          "2 tbsp olive oil",
          "1 lemon",
          "Tahini dressing",
          "Salt and pepper",
        ],
        instructions: [
          "Cook quinoa according to package directions",
          "Toss sweet potato and chickpeas with olive oil, salt, and pepper",
          "Roast at 400°F (200°C) for 25 minutes",
          "Massage kale with lemon juice and olive oil",
          "Assemble bowls with quinoa, roasted vegetables, avocado, and kale",
          "Drizzle with tahini dressing",
        ],
        cooking_time: 40,
        difficulty: "Easy",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
      },
      {
        title: "Shrimp Scampi",
        description: "Garlicky shrimp scampi with linguine pasta",
        ingredients: [
          "400g linguine",
          "500g shrimp, peeled and deveined",
          "4 cloves garlic, minced",
          "1/4 cup butter",
          "1/4 cup olive oil",
          "1/2 cup white wine",
          "1 lemon",
          "Fresh parsley",
          "Red pepper flakes",
          "Salt and pepper",
        ],
        instructions: [
          "Cook linguine according to package directions",
          "In a large skillet, heat butter and olive oil",
          "Add garlic and red pepper flakes, cook for 1 minute",
          "Add shrimp and cook for 2-3 minutes per side",
          "Add white wine and lemon juice, simmer for 2 minutes",
          "Toss with cooked pasta and garnish with parsley",
        ],
        cooking_time: 25,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1563379091339-03246963d8a9?w=400",
      },
      {
        title: "Banana Bread",
        description: "Moist and delicious homemade banana bread",
        ingredients: [
          "3 ripe bananas",
          "1/3 cup butter, melted",
          "1 cup sugar",
          "1 egg",
          "1 tsp vanilla extract",
          "1 tsp baking soda",
          "1/4 tsp salt",
          "1 1/2 cups all-purpose flour",
          "1/2 cup chopped walnuts (optional)",
        ],
        instructions: [
          "Preheat oven to 350°F (175°C)",
          "Mash bananas in a large bowl",
          "Mix in melted butter, sugar, egg, and vanilla",
          "In a separate bowl, whisk together flour, baking soda, and salt",
          "Gradually mix dry ingredients into wet ingredients",
          "Fold in walnuts if using",
          "Pour into greased loaf pan and bake for 50-60 minutes",
        ],
        cooking_time: 70,
        difficulty: "Easy",
        servings: 8,
        image_url:
          "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400",
      },
      {
        title: "Mushroom Risotto",
        description: "Creamy Italian risotto with wild mushrooms",
        ingredients: [
          "1 1/2 cups arborio rice",
          "500g mixed mushrooms",
          "4 cups vegetable broth",
          "1 onion, diced",
          "3 cloves garlic, minced",
          "1/2 cup white wine",
          "1/2 cup parmesan cheese",
          "2 tbsp butter",
          "2 tbsp olive oil",
          "Fresh thyme",
          "Salt and pepper",
        ],
        instructions: [
          "Heat olive oil and butter in a large pan",
          "Sauté onion and garlic until soft",
          "Add mushrooms and cook until browned",
          "Add rice and stir for 2 minutes",
          "Add wine and stir until absorbed",
          "Gradually add hot broth, stirring constantly",
          "Cook for 20-25 minutes until rice is creamy",
          "Stir in parmesan cheese and season to taste",
        ],
        cooking_time: 45,
        difficulty: "Hard",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400",
      },
      {
        title: "Smoothie Bowl",
        description: "Colorful and nutritious smoothie bowl with toppings",
        ingredients: [
          "2 frozen bananas",
          "1 cup frozen berries",
          "1/2 cup almond milk",
          "1 tbsp honey",
          "Granola",
          "Fresh fruit",
          "Chia seeds",
          "Coconut flakes",
        ],
        instructions: [
          "Blend frozen bananas, berries, almond milk, and honey until smooth",
          "Pour into a bowl",
          "Top with granola, fresh fruit, chia seeds, and coconut flakes",
          "Serve immediately while still cold",
        ],
        cooking_time: 15,
        difficulty: "Easy",
        servings: 2,
        image_url:
          "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400",
      },
      {
        title: "Fish Tacos",
        description: "Fresh and light fish tacos with cabbage slaw",
        ingredients: [
          "4 white fish fillets",
          "8 corn tortillas",
          "2 cups shredded cabbage",
          "1/4 cup mayonnaise",
          "1 lime",
          "1 tbsp chili powder",
          "2 tbsp olive oil",
          "Salt and pepper",
          "Fresh cilantro",
        ],
        instructions: [
          "Season fish with chili powder, salt, and pepper",
          "Heat olive oil in a skillet and cook fish for 3-4 minutes per side",
          "Mix cabbage with mayonnaise, lime juice, and cilantro",
          "Warm tortillas in a dry skillet",
          "Flake fish and serve in tortillas with cabbage slaw",
        ],
        cooking_time: 30,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
      },
      {
        title: "Tiramisu",
        description: "Classic Italian dessert with coffee and mascarpone",
        ingredients: [
          "6 egg yolks",
          "1 cup sugar",
          "1 1/4 cups mascarpone cheese",
          "1 3/4 cups heavy cream",
          "1 package ladyfinger cookies",
          "1 cup strong coffee, cooled",
          "2 tbsp coffee liqueur",
          "Cocoa powder for dusting",
        ],
        instructions: [
          "Whisk egg yolks and sugar until pale and thick",
          "Fold in mascarpone cheese",
          "Whip heavy cream to stiff peaks and fold into mascarpone mixture",
          "Dip ladyfingers in coffee and layer in a dish",
          "Spread half the mascarpone mixture over cookies",
          "Repeat layers and dust with cocoa powder",
          "Refrigerate for at least 4 hours",
        ],
        cooking_time: 60,
        difficulty: "Hard",
        servings: 8,
        image_url:
          "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
      },
      {
        title: "Pad Thai",
        description:
          "Authentic Thai stir-fried rice noodles with shrimp and peanuts",
        ingredients: [
          "200g rice noodles",
          "200g shrimp",
          "2 eggs",
          "1 cup bean sprouts",
          "2 green onions, chopped",
          "1/4 cup peanuts, crushed",
          "2 tbsp fish sauce",
          "2 tbsp tamarind paste",
          "2 tbsp palm sugar",
          "2 tbsp vegetable oil",
          "Lime wedges",
        ],
        instructions: [
          "Soak rice noodles in warm water for 30 minutes",
          "Heat oil in a wok and scramble eggs, set aside",
          "Stir-fry shrimp until pink, set aside",
          "Add noodles and sauce ingredients to wok",
          "Return eggs and shrimp, add bean sprouts and green onions",
          "Garnish with crushed peanuts and lime wedges",
        ],
        cooking_time: 25,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      },
      {
        title: "French Onion Soup",
        description:
          "Classic French soup with caramelized onions and melted cheese",
        ingredients: [
          "4 large onions, thinly sliced",
          "4 tbsp butter",
          "2 tbsp olive oil",
          "4 cups beef broth",
          "1 cup white wine",
          "4 slices French bread",
          "2 cups gruyere cheese, grated",
          "2 cloves garlic",
          "Salt and pepper",
          "Fresh thyme",
        ],
        instructions: [
          "Melt butter and olive oil in a large pot",
          "Add onions and cook over low heat for 45 minutes until caramelized",
          "Add wine and cook for 5 minutes",
          "Add beef broth and simmer for 30 minutes",
          "Toast bread and rub with garlic",
          "Ladle soup into bowls, top with bread and cheese",
          "Broil until cheese is melted and bubbly",
        ],
        cooking_time: 90,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
      },
      {
        title: "Chocolate Mousse",
        description: "Light and airy chocolate mousse dessert",
        ingredients: [
          "200g dark chocolate",
          "4 egg yolks",
          "4 egg whites",
          "1/4 cup sugar",
          "1/2 cup heavy cream",
          "1 tsp vanilla extract",
          "Pinch of salt",
        ],
        instructions: [
          "Melt chocolate in a double boiler",
          "Whisk egg yolks and sugar until pale",
          "Fold melted chocolate into egg yolk mixture",
          "Whip heavy cream to soft peaks and fold in",
          "Whip egg whites with salt to stiff peaks and fold in",
          "Divide into serving glasses and refrigerate for 2 hours",
        ],
        cooking_time: 30,
        difficulty: "Medium",
        servings: 6,
        image_url:
          "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
      },
      {
        title: "Beef Bourguignon",
        description: "Classic French beef stew with red wine and mushrooms",
        ingredients: [
          "1kg beef chuck, cubed",
          "200g bacon, diced",
          "2 onions, diced",
          "3 carrots, chopped",
          "3 cloves garlic, minced",
          "2 cups red wine",
          "2 cups beef broth",
          "200g mushrooms",
          "2 tbsp tomato paste",
          "Fresh thyme and bay leaves",
          "Salt and pepper",
        ],
        instructions: [
          "Brown beef and bacon in a large Dutch oven",
          "Add onions, carrots, and garlic, cook until softened",
          "Add wine, broth, tomato paste, and herbs",
          "Simmer covered for 2-3 hours until beef is tender",
          "Add mushrooms and cook for 15 minutes",
          "Season with salt and pepper to taste",
        ],
        cooking_time: 180,
        difficulty: "Hard",
        servings: 6,
        image_url:
          "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
      },
      {
        title: "Greek Moussaka",
        description:
          "Layered eggplant casserole with ground lamb and béchamel sauce",
        ingredients: [
          "2 large eggplants, sliced",
          "500g ground lamb",
          "1 onion, diced",
          "3 cloves garlic, minced",
          "2 tbsp tomato paste",
          "1/2 cup red wine",
          "1/4 cup flour",
          "2 cups milk",
          "2 egg yolks",
          "1/2 cup parmesan cheese",
          "Cinnamon and nutmeg",
          "Salt and pepper",
        ],
        instructions: [
          "Salt eggplant slices and let sit for 30 minutes",
          "Brown lamb with onion and garlic",
          "Add tomato paste, wine, and spices, simmer for 20 minutes",
          "Make béchamel sauce with flour, milk, and egg yolks",
          "Layer eggplant, lamb mixture, and béchamel in a baking dish",
          "Top with parmesan and bake for 45 minutes",
        ],
        cooking_time: 120,
        difficulty: "Hard",
        servings: 6,
        image_url:
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
      },
      {
        title: "Apple Pie",
        description: "Classic American apple pie with flaky crust",
        ingredients: [
          "2 pie crusts",
          "6 cups apples, sliced",
          "3/4 cup sugar",
          "2 tbsp flour",
          "1 tsp cinnamon",
          "1/4 tsp nutmeg",
          "1/4 tsp salt",
          "2 tbsp butter",
          "1 egg, beaten",
        ],
        instructions: [
          "Preheat oven to 425°F (220°C)",
          "Mix apples with sugar, flour, spices, and salt",
          "Line pie dish with one crust",
          "Fill with apple mixture and dot with butter",
          "Cover with second crust and crimp edges",
          "Brush with beaten egg and cut vents",
          "Bake for 45 minutes until golden brown",
        ],
        cooking_time: 75,
        difficulty: "Medium",
        servings: 8,
        image_url:
          "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400",
      },
      {
        title: "Ramen",
        description: "Japanese noodle soup with rich broth and toppings",
        ingredients: [
          "4 portions ramen noodles",
          "4 cups chicken broth",
          "2 tbsp soy sauce",
          "2 tbsp miso paste",
          "4 soft-boiled eggs",
          "2 cups spinach",
          "4 green onions, sliced",
          "2 sheets nori",
          "Sesame oil",
          "Chili oil",
        ],
        instructions: [
          "Cook ramen noodles according to package directions",
          "Heat broth and stir in soy sauce and miso paste",
          "Add spinach to broth and cook for 1 minute",
          "Divide noodles among bowls",
          "Ladle hot broth over noodles",
          "Top with soft-boiled eggs, green onions, and nori",
          "Drizzle with sesame oil and chili oil",
        ],
        cooking_time: 45,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1563379091339-03246963d8a9?w=400",
      },
      {
        title: "Paella",
        description: "Spanish rice dish with seafood and saffron",
        ingredients: [
          "2 cups paella rice",
          "4 cups chicken broth",
          "1 pinch saffron",
          "200g shrimp",
          "200g mussels",
          "1 onion, diced",
          "2 cloves garlic, minced",
          "1 red bell pepper, sliced",
          "1/2 cup peas",
          "2 tbsp olive oil",
          "1 lemon",
          "Fresh parsley",
        ],
        instructions: [
          "Heat olive oil in a paella pan",
          "Sauté onion, garlic, and bell pepper",
          "Add rice and stir for 2 minutes",
          "Add hot broth with saffron",
          "Arrange seafood on top",
          "Cook without stirring for 20 minutes",
          "Add peas and cook for 5 more minutes",
          "Garnish with lemon and parsley",
        ],
        cooking_time: 50,
        difficulty: "Hard",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400",
      },
      {
        title: "Chicken Curry",
        description:
          "Spicy Indian curry with tender chicken and aromatic spices",
        ingredients: [
          "800g chicken breast, cubed",
          "2 tbsp curry powder",
          "1 can coconut milk",
          "1 onion, diced",
          "3 cloves garlic, minced",
          "1 inch ginger, grated",
          "2 tomatoes, diced",
          "2 tbsp vegetable oil",
          "Fresh cilantro",
          "Basmati rice",
        ],
        instructions: [
          "Heat oil and sauté onion, garlic, and ginger",
          "Add curry powder and cook for 1 minute",
          "Add chicken and brown on all sides",
          "Add tomatoes and coconut milk",
          "Simmer for 20 minutes until chicken is cooked",
          "Garnish with cilantro and serve with rice",
        ],
        cooking_time: 40,
        difficulty: "Medium",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
      },
      {
        title: "Pancakes",
        description: "Fluffy homemade pancakes with maple syrup",
        ingredients: [
          "2 cups all-purpose flour",
          "2 tbsp sugar",
          "2 tsp baking powder",
          "1/2 tsp salt",
          "2 eggs",
          "1 3/4 cups milk",
          "1/4 cup melted butter",
          "1 tsp vanilla extract",
          "Maple syrup",
          "Butter for serving",
        ],
        instructions: [
          "Whisk together flour, sugar, baking powder, and salt",
          "In another bowl, whisk eggs, milk, melted butter, and vanilla",
          "Combine wet and dry ingredients until just mixed",
          "Heat a griddle or large skillet over medium heat",
          "Pour 1/4 cup batter for each pancake",
          "Cook until bubbles form, then flip and cook other side",
          "Serve with butter and maple syrup",
        ],
        cooking_time: 20,
        difficulty: "Easy",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
      },
      {
        title: "Sushi Roll",
        description: "Fresh California roll with avocado and crab",
        ingredients: [
          "2 cups sushi rice",
          "4 sheets nori",
          "1 avocado, sliced",
          "200g imitation crab",
          "1 cucumber, julienned",
          "1/4 cup rice vinegar",
          "1 tbsp sugar",
          "1 tsp salt",
          "Soy sauce",
          "Wasabi",
          "Pickled ginger",
        ],
        instructions: [
          "Cook sushi rice and season with vinegar, sugar, and salt",
          "Place nori on bamboo mat",
          "Spread rice evenly over nori",
          "Add avocado, crab, and cucumber in a line",
          "Roll tightly using the bamboo mat",
          "Cut into 8 pieces with a sharp knife",
          "Serve with soy sauce, wasabi, and ginger",
        ],
        cooking_time: 45,
        difficulty: "Hard",
        servings: 4,
        image_url:
          "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
      },
    ];

    for (const recipe of recipes) {
      await client.query(
        `INSERT INTO recipes (title, description, ingredients, instructions, cooking_time, difficulty, servings, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          recipe.title,
          recipe.description,
          recipe.ingredients,
          recipe.instructions,
          recipe.cooking_time,
          recipe.difficulty,
          recipe.servings,
          recipe.image_url,
        ]
      );
    }

    console.log("Seeded 30 recipes successfully");
  } finally {
    client.release();
  }
};

const main = async () => {
  try {
    await createTables();
    await seedData();
    console.log("Database setup complete!");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
