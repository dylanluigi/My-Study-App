---
description: How to add a new widget to the Dashboard
---
1. **Create the Widget Component**
   Create a new file in `src/components/dashboard/widgets/`, e.g., `MyNewWidget.tsx`.

   ```tsx
   import { BaseWidget } from '../BaseWidget'; // adjust path as needed

   export function MyNewWidget() {
       return (
           <BaseWidget 
               title="My Widget" 
               colSpan={1} // 1, 2, 3, or 4
               icon={<SomeIcon />}
           >
               <div className="p-4">
                   Your content here...
               </div>
           </BaseWidget>
       );
   }
   ```

2. **Add to Dashboard**
   Open `src/components/dashboard/DashboardView.tsx`.
   Import your text widget:
   ```tsx
   import { MyNewWidget } from './widgets/MyNewWidget';
   ```

3. **Place in Grid**
   Add `<MyNewWidget />` inside the main `div className="grid ...">`.
   The grid will automatically arrange it based on available space and the `colSpan` you set.
