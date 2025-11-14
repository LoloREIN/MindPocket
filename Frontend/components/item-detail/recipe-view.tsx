'use client';

import { useState } from 'react';
import { type WellnessItem } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Users, ChefHat } from 'lucide-react';

interface RecipeViewProps {
  item: WellnessItem;
}

export function RecipeView({ item }: RecipeViewProps) {
  const recipe = item.enrichedData?.recipe;
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  if (!recipe) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Recipe data not available yet</p>
        </CardContent>
      </Card>
    );
  }

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  return (
    <div className="space-y-6">
      {/* Recipe Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="h-6 w-6" />
            <CardTitle className="text-2xl">{recipe.name}</CardTitle>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {recipe.time_minutes && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {recipe.time_minutes} min
              </Badge>
            )}
            {recipe.servings && (
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {recipe.servings} servings
              </Badge>
            )}
            {recipe.difficulty && (
              <Badge variant="outline">{recipe.difficulty}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-start gap-3">
                <Checkbox
                  checked={checkedIngredients.has(index)}
                  onCheckedChange={() => toggleIngredient(index)}
                  id={`ingredient-${index}`}
                />
                <label
                  htmlFor={`ingredient-${index}`}
                  className={`flex-1 cursor-pointer ${
                    checkedIngredients.has(index) ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {ingredient.quantity && (
                    <span className="font-medium">{ingredient.quantity} </span>
                  )}
                  {ingredient.item}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <p className="flex-1 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
